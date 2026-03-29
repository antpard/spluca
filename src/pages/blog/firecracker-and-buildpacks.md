---
layout: ../../layouts/BlogLayout.astro
title: Firecracker and Buildpacks 
description: Firecracker and Buildpacks integration 
tags: ["firecracker", "buildpacks", "go", "mikrom"]
time: 15 
featured: true
timestamp: 2026-03-29T15:15:00+00:00
filename: firecracker-and-buildpacks
---

# From Source Code to Firecracker VM in One API Call: Integrating Cloud Native Buildpacks into Mikrom

[Mikrom](https://mikrom.es) is an orchestration layer for [Firecracker](https://firecracker-microvm.github.io/) microVMs. Until recently, creating a VM required you to already have a kernel and a root filesystem (`rootfs.ext4`) sitting somewhere on disk. That's fine for infrastructure operators, but it creates friction for developers who just want to run their application inside a microVM.

This post walks through how we integrated [Cloud Native Buildpacks](https://buildpacks.io/) into the Mikrom API so that a developer can go from source code to a running Firecracker VM with a single HTTP request.

---

## The problem

Firecracker is not a container runtime. It boots a real Linux kernel and mounts a real ext4 filesystem. The typical workflow looks like this:

```
pack build my-app --builder paketobuildpacks/builder:base
docker create --name tmp my-app
docker export tmp | tar -xf - -C /mnt/rootfs
umount /mnt/rootfs
# ... then pass rootfs.ext4 to Firecracker
```

That's four manual steps before you even touch the VM API. We wanted to hide all of that behind a single endpoint.

---

## Architecture overview

Mikrom's backend (`mikrom-api`) already had an async worker pipeline built on [asynq](https://github.com/hibiken/asynq) and Redis. VM operations — create, start, stop, restart — are all enqueued as background tasks processed by a worker. The gRPC-based `firecracker-agent` running on bare-metal nodes does the actual heavy lifting.

The new build flow fits naturally into this pipeline:

```
POST /api/v1/vms/build
        │
        ▼
  VM record created        ← status: "building"
  task app:build enqueued
        │
        ▼ (worker)
  pack build               ← OCI image
  docker export | ext4     ← rootfs.ext4
  VM.rootfs_path updated
        │
        ▼
  status: "provisioning"
  IP allocated
  gRPC → firecracker-agent ← CreateVM
        │
        ▼
  status: "running"
```

---

## Step 1: A dedicated `buildpack` package

We added `mikrom-api/internal/buildpack/builder.go` with two pure functions that wrap the external tooling.

**`Build`** delegates to the `pack` CLI:

```go
func Build(ctx context.Context, sourceDir, imageName, builder string) error {
    if builder == "" {
        builder = DefaultBuilder // "paketobuildpacks/builder:base"
    }
    cmd := exec.CommandContext(ctx, "pack", "build", imageName,
        "--path", sourceDir,
        "--builder", builder,
    )
    cmd.Stdout = os.Stdout
    cmd.Stderr = os.Stderr
    if err := cmd.Run(); err != nil {
        return fmt.Errorf("pack build failed for image %s: %w", imageName, err)
    }
    return nil
}
```

**`ExtractRootfs`** turns the resulting OCI image into an ext4 disk image that Firecracker can mount. The key part is streaming `docker export` directly into `tar` without writing an intermediate tarball to disk:

```go
func ExtractRootfs(ctx context.Context, imageName, outputPath string) error {
    containerName := "mikrom-extract-" + sanitize(filepath.Base(outputPath))

    // Create a stopped container from the image.
    exec.CommandContext(ctx, "docker", "create", "--name", containerName, imageName).Run()
    defer exec.Command("docker", "rm", "-f", containerName).Run()

    // Create a blank 512 MiB ext4 image.
    exec.CommandContext(ctx, "truncate", "-s", "512M", outputPath).Run()
    exec.CommandContext(ctx, "mkfs.ext4", "-F", outputPath).Run()

    // Mount it and stream the container filesystem in.
    mountDir, _ := os.MkdirTemp("", "mikrom-rootfs-*")
    defer os.RemoveAll(mountDir)

    exec.CommandContext(ctx, "mount", outputPath, mountDir).Run()
    defer exec.Command("umount", mountDir).Run()

    exportCmd := exec.CommandContext(ctx, "docker", "export", containerName)
    tarCmd := exec.CommandContext(ctx, "tar", "-xf", "-", "-C", mountDir)
    pipe, _ := exportCmd.StdoutPipe()
    tarCmd.Stdin = pipe

    exportCmd.Start()
    tarCmd.Start()
    exportCmd.Wait()
    return tarCmd.Wait()
}
```

(The real implementation has proper error handling on each step — the excerpt above is simplified for readability.)

---

## Step 2: A new worker task type

We added `TypeBuildApp = "app:build"` to the existing task constants and a corresponding payload struct:

```go
type BuildAppPayload struct {
    VMID            string `json:"vm_id"`
    UserID          uint   `json:"user_id"`
    Name            string `json:"name"`
    VCPUCount       int    `json:"vcpu_count"`
    MemoryMB        int    `json:"memory_mb"`
    Description     string `json:"description,omitempty"`
    // Build configuration
    SourceDir       string `json:"source_dir"`
    Builder         string `json:"builder"`
    // VM configuration
    KernelPath      string `json:"kernel_path"`
    RootfsOutputDir string `json:"rootfs_output_dir"`
}
```

The worker handler runs the full pipeline — build, extract, provision — in a single task. It sets the VM status at each stage so the caller can poll `GET /api/v1/vms/:vm_id` and see exactly what's happening:

```go
func (h *TaskHandler) HandleBuildApp(ctx context.Context, t *asynq.Task) error {
    var payload BuildAppPayload
    json.Unmarshal(t.Payload(), &payload)

    imageName := "mikrom-" + payload.VMID
    rootfsPath := filepath.Join(payload.RootfsOutputDir, payload.VMID+".ext4")

    // Build phase
    h.vmRepo.UpdateStatus(payload.VMID, models.VMStatusBuilding, "")
    if err := buildpack.Build(ctx, payload.SourceDir, imageName, payload.Builder); err != nil {
        h.vmRepo.UpdateStatus(payload.VMID, models.VMStatusError, err.Error())
        return err
    }
    if err := buildpack.ExtractRootfs(ctx, imageName, rootfsPath); err != nil {
        h.vmRepo.UpdateStatus(payload.VMID, models.VMStatusError, err.Error())
        return err
    }

    // Persist rootfs path and proceed with standard provisioning.
    vm, _ := h.vmRepo.FindByVMID(payload.VMID)
    vm.RootfsPath = rootfsPath
    h.vmRepo.Update(vm)

    // Provision phase (same as the existing vm:create task)
    h.vmRepo.UpdateStatus(payload.VMID, models.VMStatusProvisioning, "")
    allocation, _ := h.ipPoolRepo.AllocateIP(...)
    result, _ := h.grpcClient.CreateVM(ctx, grpcclient.CreateVMParams{
        VMName:     payload.VMID,
        VCPUCount:  int32(payload.VCPUCount),
        MemoryMB:   int32(payload.MemoryMB),
        IPAddress:  allocation.IPAddress,
        KernelPath: payload.KernelPath,
        RootfsPath: rootfsPath,
    })

    h.vmRepo.UpdateStatus(payload.VMID, result.GetVMStatus(), "")
    return nil
}
```

The task is enqueued on the `low` priority queue with a 30-minute timeout (buildpack builds for JVM or Rust applications can be slow on first run) and `MaxRetry(1)` — build failures are not idempotent, so automatic retries would just waste resources.

---

## Step 3: A new VM status

We added `VMStatusBuilding` to the status state machine:

```
pending → building → provisioning → running
                 ↘ error
```

This gives clients a clear signal that the VM exists in the database but is still being compiled.

---

## Step 4: Service and handler

The `VMService` received a new `BuildAndCreateVM` method. It accepts a `BuildVMRequest`, creates the VM record with `status: building`, and enqueues the task:

```go
type BuildVMRequest struct {
    Name        string `json:"name"        binding:"required,min=1,max=64"`
    Description string `json:"description" binding:"max=500"`
    VCPUCount   int    `json:"vcpu_count"  binding:"required,min=1,max=32"`
    MemoryMB    int    `json:"memory_mb"   binding:"required,min=128,max=32768"`
    SourceDir   string `json:"source_dir"  binding:"required"`
    Builder     string `json:"builder"`     // optional, defaults to builder:base
    KernelPath  string `json:"kernel_path"`
}
```

The handler is a single new method on `VMHandler`:

```go
func (h *VMHandler) BuildVM(c *gin.Context) {
    userID, _ := c.Get("user_id")

    var req models.BuildVMRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
        return
    }

    vm, err := h.vmService.BuildAndCreateVM(req, userID.(int))
    if err != nil {
        c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: err.Error()})
        return
    }

    c.JSON(http.StatusAccepted, vm)
}
```

It responds `202 Accepted` immediately — the build happens in the background.

The route is registered as `POST /api/v1/vms/build`, placed before the `/:vm_id` wildcard to avoid routing conflicts.

---

## Using the new endpoint

Here's the full developer experience, starting from source code:

```bash
# 1. Build and launch a Go HTTP service as a Firecracker microVM
curl -X POST https://api.mikrom.example/api/v1/vms/build \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "go-task-api",
    "vcpu_count": 1,
    "memory_mb": 256,
    "source_dir": "/srv/apps/go-task-api",
    "builder": "paketobuildpacks/builder:base"
  }'

# Response (202 Accepted):
# {
#   "vm_id": "srv-a1b2c3d4",
#   "name": "go-task-api",
#   "status": "building",
#   ...
# }

# 2. Poll until running
curl https://api.mikrom.example/api/v1/vms/srv-a1b2c3d4 \
  -H "Authorization: Bearer $TOKEN"

# Status transitions: building → provisioning → running

# 3. Hit the app running inside the VM
curl http://192.168.100.42:8080/health
# {"status": "ok"}
```

The `builder` field is optional. If omitted it defaults to `paketobuildpacks/builder:base`, which covers Go, Node.js, Python, and Java. Rust applications need `paketobuildpacks/builder:full` because the Rust buildpack requires a C compiler toolchain.

---

## Testing approach

Because `Build` and `ExtractRootfs` shell out to `pack` and `docker`, we can't mock them at the unit level without a full integration setup. Instead we test three things:

1. **Error propagation** — overriding `PATH` to make the binary unavailable confirms the function returns a descriptive error, not a panic or a silent failure.
2. **Context cancellation** — passing a pre-cancelled `context` verifies the command is terminated correctly.
3. **Conditional tests** — tests that require `docker` or `pack` to actually be installed use `t.Skip` when the binary is not found, so the CI suite doesn't break in environments without Docker.

```go
func TestBuild_FailsWhenPackNotFound(t *testing.T) {
    t.Setenv("PATH", "/nonexistent")

    err := Build(context.Background(), "/tmp", "test-image", DefaultBuilder)

    assert.Error(t, err)
    assert.Contains(t, err.Error(), "pack build failed")
}

func TestExtractRootfs_FailsWhenImageDoesNotExist(t *testing.T) {
    if _, err := exec.LookPath("docker"); err != nil {
        t.Skip("docker not installed")
    }

    err := ExtractRootfs(context.Background(), "image-that-does-not-exist:latest", t.TempDir()+"/rootfs.ext4")

    assert.Error(t, err)
    assert.Contains(t, err.Error(), "docker create failed")
}
```

The service and handler layers are tested with a `MockWorkerClient` that captures the enqueued payloads, letting us assert that the right `SourceDir`, `Builder`, and `RootfsOutputDir` values flow through without ever touching Redis.

---

## What's next

A few things are still on the roadmap:

- **Automatic image cleanup** — the local Docker image (`mikrom-<vmid>`) is left behind after the rootfs is extracted. A post-build cleanup step would reclaim disk space on the API server.
- **Configurable rootfs size** — 512 MiB is hardcoded today. Exposing this as a field in `BuildVMRequest` would be straightforward.
- **Build logs streaming** — right now build output goes to stdout of the worker process. Capturing it and making it available via a `GET /api/v1/vms/:vm_id/logs` endpoint would make the developer experience much better.
- **Pre-built image support** — allowing `POST /api/v1/vms` to accept a Docker image reference (instead of source code) and skip the `pack build` step, going straight to `ExtractRootfs`.

Happy hacking
