---
layout: ../../layouts/BlogLayout.astro
title: Integrating mikrom-agent with firecracker-containerd
description: How we wired mikrom-agent to the firecracker-containerd runtime shim, and the two bugs we had to fix along the way — a missing proto field and a silent in-VM panic caused by a proto3 zero-value serialization quirk.
tags: ["firecracker", "containerd", "grpc", "go", "mikrom", "protobuf", "debugging"]
time: 14
featured: true
timestamp: 2026-04-07T10:00:00+00:00
filename: integrating-mikrom-agent-with-firecracker-containerd
---

# 🔌 Integrating mikrom-agent with firecracker-containerd

[Mikrom Agent](https://github.com/spluca/mikrom-agent) is the gRPC service that manages Firecracker microVMs on each host in the Mikrom platform. It delegates VM lifecycle to [firecracker-containerd](https://github.com/firecracker-microvm/firecracker-containerd): our agent calls `containerd.Pull`, `containerd.NewContainer`, and `container.NewTask`, and the `aws.firecracker` runtime shim handles the rest.

After [getting the underlying stack working](/blog/debugging-firecracker-containerd), it was time to wire up the agent itself. The first `CreateVM` RPC call returned:

```
rpc error: code = Internal desc = failed to start VM task: ttrpc: closed
```

The VM appeared in `ctr containers ls`, then vanished. This post covers what we found and how we fixed it.

---

## 🧱 The stack

Before diving in, here is how the layers fit together:

```
gRPC client (grpcurl / mikrom-api)
        │  :50051
        ▼
Mikrom Agent  (Go, containerd v2 client)
        │
        ▼
firecracker-containerd daemon  (v1.7.29, containerd API v1)
        │  aws.firecracker shim
        ▼
Firecracker process
        │  vsock
        ▼
in-VM guest agent
```

Our agent uses `github.com/containerd/containerd/v2` — the current release. The firecracker-containerd daemon we are running embeds `github.com/containerd/containerd` at v1.7.29, one major version behind. This mismatch is the root of the problem we hit, but it reveals itself in a very indirect way.

---

## 🐛 Bug 1: ImageRef field was ignored

The first failure was straightforward. Our `CreateVM` protobuf message has an `ImageRef` field:

```protobuf
message CreateVMRequest {
  string name      = 1;
  string image_ref = 8;
  // …
}
```

But the function that resolved the image reference was not reading it:

```go
func imageRefFromRequest(req *pb.CreateVMRequest) string {
    if ref, ok := req.Metadata["image_ref"]; ok && ref != "" {
        return ref
    }
    if strings.ContainsAny(req.RootfsPath, ":/") {
        return req.RootfsPath
    }
    return ""
}
```

The field had been added to the proto but the Go code was still only looking at `metadata["image_ref"]` and `rootfs_path`. Fix: check the typed field first.

```go
func imageRefFromRequest(req *pb.CreateVMRequest) string {
    if req.ImageRef != "" {
        return req.ImageRef
    }
    if ref, ok := req.Metadata["image_ref"]; ok && ref != "" {
        return ref
    }
    if strings.ContainsAny(req.RootfsPath, ":/") {
        return req.RootfsPath
    }
    return ""
}
```

With that, the image pull succeeded and the container was created. Then `container.NewTask` returned `ttrpc: closed`.

---

## 🐛 Bug 2: ttrpc: closed

ttrpc is a minimal RPC protocol used for communication between the containerd shim and the in-VM guest agent over a vsock connection. `ttrpc: closed` means the connection dropped before a response was sent — either a crash, a timeout, or an explicit close on the other end.

From the caller's side the error is opaque. We tailed the Firecracker serial console output (the shim logs it under `vmm_stream=stdout`) and found:

```
panic: interface conversion: interface {} is *containerd_v1_types.CreateVMRequest,
       not *options.Options

goroutine 1 [running]:
github.com/firecracker-microvm/firecracker-containerd/agent.logPanicAndDie(...)
```

The in-VM guest agent was panicking. `logPanicAndDie` calls `logger.Fatalf` which calls `os.Exit(1)`. The vsock closes. The shim gets `ttrpc: closed`. That error propagates back to our gRPC call.

### ❓ Why was the agent receiving a CreateVMRequest?

Inside the firecracker-containerd shim, the `Create` handler has a fallback for task options (simplified):

```go
func (s *service) Create(ctx context.Context, r *taskAPI.CreateTaskRequest) (*taskAPI.CreateTaskResponse, error) {
    if r.Options != nil && r.Options.GetValue() != nil {
        v, _ := typeurl.UnmarshalAny(r.Options)
        opts = v.(*options.Options)  // ← panics if v is *CreateVMRequest
    } else {
        // fallback: use RuntimeOptions, which holds the CreateVMRequest
        v, _ := typeurl.UnmarshalAny(r.RuntimeOptions)
        vmConfig = v.(*CreateVMRequest)
    }
}
```

When `GetValue()` returns `nil`, the code takes the fallback path and loads `RuntimeOptions`, which contains the `CreateVMRequest` from the original `NewContainer` call. A later code path then unconditionally asserts `v.(*options.Options)` — and panics because `v` is actually a `*CreateVMRequest`.

So the real question is: why was `GetValue()` returning `nil`?

### ⚠️ The proto3 zero-value trap

Our `NewTask` call was setting options like this:

```go
task, err := container.NewTask(ctx, cio.LogFile(os.DevNull),
    func(_ context.Context, _ *containerd.Client, ti *containerd.TaskInfo) error {
        ti.Options = &runcoptions.Options{}
        return nil
    })
```

`runcoptions.Options` is a proto3 message. In proto3, **fields with zero/default values are omitted from the wire format**. `proto.Marshal(&runcoptions.Options{})` produces `[]byte{}` — zero bytes.

The containerd v2 client wraps this in a `types.Any`:

```go
any := &types.Any{
    TypeUrl: "...",
    Value:   marshaledBytes, // []byte{}
}
```

This travels over gRPC. On the receiving end (the v1.7 shim), proto3 deserialization applies the rule for `bytes` fields: if the wire value is empty, the field is `nil` in the Go struct. So `r.Options.GetValue()` returns `nil` even though we explicitly set `ti.Options`.

We wrote a test to lock in this behavior:

```go
func TestNewTaskOpts_EmptyOptions_EmptyProtoBytes(t *testing.T) {
    opts := &runcoptions.Options{}
    b, err := proto.Marshal(opts)
    require.NoError(t, err)
    assert.Equal(t, []byte{}, b,
        "proto3 marshals zero-value Options to empty bytes")
}
```

### ✅ The fix

Set any non-zero field so that `proto.Marshal` produces actual bytes on the wire:

```go
task, err := container.NewTask(ctx, cio.LogFile(os.DevNull),
    func(_ context.Context, _ *containerd.Client, ti *containerd.TaskInfo) error {
        ti.Options = &runcoptions.Options{BinaryName: "runc"}
        return nil
    })
```

`BinaryName: "runc"` serializes to 6 bytes. After deserialization, `GetValue()` returns a non-nil slice. The shim's condition is true. The fallback path is not taken. No panic. No `ttrpc: closed`.

A test pins this:

```go
func TestNewTaskOpts_BinaryName_NonEmptyProtoBytes(t *testing.T) {
    opts := &runcoptions.Options{BinaryName: "runc"}
    b, err := proto.Marshal(opts)
    require.NoError(t, err)
    assert.NotEmpty(t, b,
        "BinaryName field produces non-empty bytes on the wire")
}
```

---

## 🔀 Why this only appeared with the v2 client

The containerd v2 client always sets `ti.Options`, but with a zero-value struct that serializes to nothing. The v1.7 shim was written expecting either a populated `CreateVMRequest` in `RuntimeOptions` or a fully populated `Options` — not an empty `Any`. The fallback logic made sense for v1 clients. Against a v2 client it triggers unconditionally when the options struct has no non-zero fields.

Neither side is wrong in isolation. The mismatch only surfaces at the boundary.

---

## 📋 Summary

| Step | What happened | Fix |
|---|---|---|
| `imageRefFromRequest` | `req.ImageRef` typed field was not checked | Check it first, before metadata and rootfs_path |
| `container.NewTask` | `&runcoptions.Options{}` → zero bytes on wire → `GetValue() == nil` | `BinaryName: "runc"` → 6 non-zero bytes |
| Shim fallback | Loads `CreateVMRequest` from `RuntimeOptions` instead of `Options` | (fixed by above) |
| In-VM agent | Type-asserts `v.(*options.Options)` → panics on `*CreateVMRequest` | (fixed by above) |
| `logPanicAndDie` | Calls `os.Exit(1)` → vsock closes → `ttrpc: closed` | (fixed by above) |

The surface error was four layers removed from the actual cause. Each layer was reasonable on its own. The combination was not.

---

## 💡 Takeaways

**proto3 zero values are invisible on the wire.** You cannot distinguish "field set to empty" from "field not set at all". If your logic depends on detecting whether a caller set a field, use `oneof`, wrapper types, or a non-zero sentinel — not a bare proto3 field.

**Version boundaries hide in error messages.** `ttrpc: closed` tells you the transport dropped. It says nothing about why. When two systems work independently but fail at the boundary, trace back through each layer's assumptions about what the other side sends.

**Tests that document bugs are worth keeping.** `TestNewTaskOpts_EmptyOptions_EmptyProtoBytes` is not a "this should pass" test — it is a "this is the footgun and here is exactly how it works" test. It stays in the suite long after the fix, explaining the invariant to whoever reads the code next.

---

The fix lives in [`internal/firecracker/manager.go`](https://github.com/spluca/mikrom-agent/blob/main/internal/firecracker/manager.go). The containerd v2/v1 boundary behavior is documented in [`docs/architecture.md`](https://github.com/spluca/mikrom-agent/blob/main/docs/architecture.md).
