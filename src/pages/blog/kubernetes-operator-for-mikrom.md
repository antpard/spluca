---
layout: ../../layouts/BlogLayout.astro
title: Creando un operador de Kubernetes para Mikrom
description: How we designed and built a Kubernetes operator to manage Firecracker microVMs natively — the MikromVM CRD, the reconciler lifecycle, and how we test it all without a real cluster.
tags: ["kubernetes", "operator", "firecracker", "go", "mikrom", "kubebuilder", "controller-runtime"]
time: 10
featured: true
timestamp: 2026-04-09T12:00:00+00:00
filename: kubernetes-operator-for-mikrom
---

# Creando un operador de Kubernetes para Mikrom

[Mikrom](https://mikrom.es) is a microVM-as-a-service platform built on top of
[Firecracker](https://firecracker-microvm.github.io/). Until now, VM lifecycle was driven by
`mikrom-api`: an HTTP request lands, a Redis task is enqueued, a worker picks it up and calls
`firecracker-agent` via gRPC to create and start the VM on a specific host.

That works, but it is not Kubernetes-native. Nodes are not represented as cluster state.
There is no declarative API, no self-healing, no standard place to describe a VM the way you
describe a Pod. If the worker crashes mid-flight, nobody reconciles. If a VM silently dies,
nobody notices.

The fix is a Kubernetes operator with a `MikromVM` Custom Resource Definition.

---

## Why an operator

A Kubernetes operator is a controller that watches custom resources and reconciles the world
toward the desired state declared in those resources. The pattern is exactly what we need:

- **Declarative**: create a `MikromVM` object, the operator provisions the actual microVM.
- **Self-healing**: if the VM dies on the agent, the next reconcile loop detects it and updates
  the status. Future iterations can restart it.
- **Migration path**: instead of the `mikrom-api` worker calling `firecracker-agent` directly,
  it creates a `MikromVM` CR. The operator takes it from there.

The last point is important. We are not replacing `mikrom-api` overnight — we are adding a
Kubernetes-native control plane alongside it, then migrating the worker incrementally.

---

## The repository

We scaffolded `mikrom-operator` with [kubebuilder](https://book.kubebuilder.io/) 4.13.1:

```bash
kubebuilder init --domain mikrom.es --repo github.com/mikrom/mikrom-operator
kubebuilder create api --group vm --version v1alpha1 --kind MikromVM --resource --controller
```

This gives us the project layout, the CRD scaffolding, RBAC markers, and the reconciler stub.
Everything in Go 1.26 with controller-runtime v0.23.3.

---

## The MikromVM CRD

The spec maps directly to what `firecracker-agent` needs to create a VM:

```yaml
apiVersion: vm.mikrom.es/v1alpha1
kind: MikromVM
metadata:
  name: my-app
  namespace: production
spec:
  image: docker.io/myorg/my-app:v1.2.3   # OCI image → firecracker-containerd
  vcpuCount: 2
  memoryMB: 1024
  agentAddress: "10.0.0.5:50051"          # gRPC address of firecracker-agent on the target node
  nodeName: worker-1                       # informational, for scheduling decisions
  kernelPath: ""                           # empty = agent default
```

The status captures observed reality:

```yaml
status:
  phase: Running          # Pending | Creating | Running | Stopping | Stopped | Deleting | Failed
  vmID: production-my-app
  ipAddress: 10.100.0.42
  nodeName: worker-1
  agentAddress: "10.0.0.5:50051"
  createdAt: "2026-04-09T10:00:00Z"
  conditions:
    - type: Available
      status: "True"
      reason: VMRunning
```

`kubectl get mvm` shows:

```
NAME      PHASE     IMAGE                         VCPU   RAM(MB)   IP            NODE       AGE
my-app    Running   docker.io/myorg/my-app:v1.2.3  2      1024      10.100.0.42   worker-1   3m
```

The `vmID` is always `<namespace>-<name>`, which makes it stable and derivable without storing
extra state. The agent address is copied from spec into status on first create so the delete path
can reach the right agent even if spec changes.

---

## The reconciler

The reconciler is a state machine with four paths:

```
GET MikromVM
    │
    ├─ Not found → return (nothing to do)
    │
    ├─ DeletionTimestamp set
    │       ├─ No finalizer → return
    │       └─ Has finalizer, VMID set
    │               ├─ StopVM (force, ignore NotFound)
    │               ├─ DeleteVM
    │               └─ Remove finalizer → object deleted
    │
    ├─ No finalizer → AddFinalizer, Requeue
    │
    ├─ VMID empty (not provisioned yet)
    │       ├─ Phase = Creating
    │       ├─ CreateVM on agent
    │       ├─ StartVM on agent
    │       └─ Phase = Running, RequeueAfter 30s
    │
    └─ VMID set (already running)
            ├─ GetVM on agent
            ├─ Sync Phase ← VMState
            └─ Sync IPAddress, RequeueAfter 30s
```

Every failure that originates from the agent sets `Phase=Failed` and a `Available=False`
condition. Transient gRPC errors (Unavailable, Internal) requeue without touching the status,
so a single blip does not mark a VM as failed.

The delete path always tries `StopVM` before `DeleteVM`. If `StopVM` returns `NotFound` (the VM
is already gone), we skip it and continue — idempotency matters in distributed systems.

---

## Talking to the agent

`firecracker-agent` exposes a gRPC service (`FirecrackerAgent`) with operations for the full
VM lifecycle. We vendored the generated `pb.go` files from the agent repo into
`internal/agentpb/` and wrapped them in a thin `agentclient.Interface`:

```go
type Interface interface {
    CreateVM(ctx context.Context, req *pb.CreateVMRequest) (*pb.CreateVMResponse, error)
    StartVM(ctx context.Context, vmID string) (*pb.StartVMResponse, error)
    StopVM(ctx context.Context, vmID string, force bool) (*pb.StopVMResponse, error)
    DeleteVM(ctx context.Context, vmID string) (*pb.DeleteVMResponse, error)
    GetVM(ctx context.Context, vmID string) (*pb.GetVMResponse, error)
    HealthCheck(ctx context.Context) (*pb.HealthCheckResponse, error)
    Close() error
}
```

The reconciler uses a `DialFn` to create a client per reconcile call:

```go
type MikromVMReconciler struct {
    client.Client
    Scheme    *runtime.Scheme
    DialAgent DialFn  // func(address string) (agentclient.Interface, error)
}
```

`DialAgent` defaults to `agentclient.New` (real gRPC connection). In tests we inject a fake.

---

## Testing without a real cluster

Operator tests usually require either a live cluster or [envtest](https://book.kubebuilder.io/reference/envtest.html)
(which downloads `kube-apiserver` + `etcd` binaries and starts them for the test suite). We
skipped envtest for now in favour of `controller-runtime/pkg/client/fake`, which is an
in-memory Kubernetes client that requires zero infrastructure.

The fake agent tracks every call:

```go
type fakeAgent struct {
    CreateVMFn func(*pb.CreateVMRequest) (*pb.CreateVMResponse, error)
    StartVMFn  func(string) (*pb.StartVMResponse, error)
    // ...
    CreateVMCalls []*pb.CreateVMRequest
    StartVMCalls  []string
    Closed        bool
}
```

A test spins up a reconciler in three lines:

```go
agent := &fakeAgent{}
r, fc := reconcilerWith(agent, mvm)  // fake client pre-loaded with mvm
result, err := r.Reconcile(ctx, req(mvm))
```

Then asserts on what the agent received and what ended up in the CR status:

```go
Expect(agent.CreateVMCalls[0].ImageRef).To(Equal("docker.io/myorg/my-app:v1.2.3"))
Expect(agent.StartVMCalls).To(ConsistOf("production-my-app"))

updated := &vmv1alpha1.MikromVM{}
fc.Get(ctx, namespacedName, updated)
Expect(updated.Status.Phase).To(Equal(vmv1alpha1.MikromVMPhaseRunning))
Expect(updated.Status.VMID).To(Equal("production-my-app"))
```

We ended up with 18 Ginkgo specs for the reconciler and 22 table-driven cases for pure helpers
(`pbStateToPhase`, `vmIDFor`, `isNotFound`, `setCondition`). All run in under 120ms with no
external dependencies.

One subtlety: the fake client refuses to `WithObjects()` an object that has
`DeletionTimestamp` but no finalizers, because that is an invalid Kubernetes state — objects
with no finalizers are deleted immediately and never seen by a controller. The delete tests
instead create the object normally, then call `fc.Delete()` to trigger the deletion flow.

---

## What's next

The operator is running as a standalone controller. The migration of `mikrom-api` follows:

1. **Worker update**: instead of calling `firecracker-agent` directly, the worker creates a
   `MikromVM` CR with the right `agentAddress`.
2. **DaemonSet**: `firecracker-agent` runs as a privileged DaemonSet on each Kubernetes node
   with `hostNetwork: true` and access to `/dev/kvm`.
3. **Validation webhook**: reject VMs that request more vCPUs or memory than the target node
   can provide.
4. **Node discovery**: the operator queries the agent DaemonSet pods to resolve agent addresses
   automatically, removing the need to set `agentAddress` in the spec.

The CRD and the source are at [github.com/spluca/mikrom-operator](https://github.com/spluca/mikrom-operator).
