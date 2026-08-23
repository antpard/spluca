---
layout: ../../layouts/BlogLayout.astro
title: Debugging firecracker-containerd from scratch
description: A walkthrough of every error we hit setting up firecracker-containerd on a bare-metal Debian host — devmapper, dmsetup PATH issues, glibc mismatches, and how we fixed each one.
tags: ["firecracker", "containerd", "devmapper", "go", "mikrom", "linux"]
time: 12
featured: true
timestamp: 2026-04-05T12:00:00+00:00
filename: debugging-firecracker-containerd
---

# 🐞 Debugging firecracker-containerd from scratch

[Mikrom](https://mikrom.es) runs Firecracker microVMs. Until now our `firecracker-agent` talked
to Firecracker directly via its HTTP API — creating the VM, attaching drives, configuring the
network, booting. That works, but it means we own the full lifecycle: kernel path, rootfs path,
jailer setup, socket management.

[firecracker-containerd](https://github.com/firecracker-microvm/firecracker-containerd) offers
a better model: it wraps all of that behind a standard containerd interface. You pull an OCI
image, run `ctr run`, and the `aws.firecracker` runtime shim handles the Firecracker process.
The agent only needs to manage networking and expose its gRPC API.

Switching to it took one afternoon. Not because it is complex, but because each failure was
silent in a different way. This post is a log of every error we hit and how we resolved it.

---

## 🧱 The setup

The host is a Debian Trixie machine with KVM available. The target architecture looks like this:

```
firecracker-ctr / grpcurl
        │
        ▼
firecracker-containerd   (:containerd.sock)
        │  devmapper snapshotter
        │  aws.firecracker runtime shim
        ▼
Firecracker process
        │  virtio-mmio block + vsock
        ▼
microVM kernel (hello-vmlinux.bin)
microVM rootfs (default-rootfs.img  ← squashfs with guest agent)
        │
        ▼  overlayfs
OCI image layers (busybox, ubuntu, …)
```

The shim boots the VM from a base squashfs rootfs, then mounts the OCI image's layers on top
via overlayfs. Inside the VM, a guest `agent` binary listens on vsock and proxies container
lifecycle calls back to the shim.

---

## 🚨 Error 1: snapshotter not loaded — naive

The first attempt used the config that came with our initial setup:

```
snapshotter: "naive"
```

```
failed to prepare extraction snapshot "extract-…": snapshotter not loaded: naive: invalid argument
```

The `naive` snapshotter in firecracker-containerd is a proxy plugin — a separate daemon that
must be running and registered in `config.toml` under `[proxy_plugins]`. We did not have it.

**Fix:** switch to the `devmapper` snapshotter, which ships as a built-in plugin. The config
change is straightforward:

```toml
# /etc/firecracker-containerd/config.toml
[plugins."io.containerd.snapshotter.v1.devmapper"]
  pool_name       = "fc-dev-thinpool"
  base_image_size = "10GB"
  root_path       = "/var/lib/firecracker-containerd/snapshotter/devmapper"
```

That requires a thin-pool device to exist first.

---

## 🚨 Error 2: devmapper thin-pool does not exist

Setting up a devmapper thin-pool for development does not require LVM. Loop-device-backed
files are enough:

```bash
mkdir -p /var/lib/firecracker-containerd/snapshotter/devmapper

dd if=/dev/zero \
   of=/var/lib/firecracker-containerd/snapshotter/devmapper/data \
   bs=1M count=102400   # 100 GB

dd if=/dev/zero \
   of=/var/lib/firecracker-containerd/snapshotter/devmapper/metadata \
   bs=1M count=2048     # 2 GB

DATA_DEV=$(losetup --find --show .../data)
META_DEV=$(losetup --find --show .../metadata)

dmsetup create fc-dev-thinpool \
  --table "0 $(blockdev --getsz $DATA_DEV) thin-pool \
  $META_DEV $DATA_DEV 128 32768 1 skip_block_zeroing"
```

`dmsetup ls` confirmed the pool was there. But the image pull still failed with the same
`snapshotter not loaded: devmapper: invalid argument` error.

---

## 🚨 Error 3: dmsetup not in PATH

The daemon starts the devmapper plugin during initialization. The plugin calls `dmsetup version`
to check that the tool is available. On Debian, `dmsetup` lives in `/sbin`, which is not in the
default `PATH` when processes are launched by the system.

The daemon startup log made this explicit:

```
ERRO dmsetup not available
WARN failed to load plugin io.containerd.snapshotter.v1.devmapper
     error="exec: \"dmsetup\": executable file not found in $PATH"
```

**Fix:** set PATH explicitly when launching the daemon:

```bash
sudo env PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin" \
  /usr/local/bin/firecracker-containerd \
  --config /etc/firecracker-containerd/config.toml
```

After this, `firecracker-ctr images pull --snapshotter devmapper docker.io/library/busybox:latest`
succeeded.

---

## 🚨 Error 4: VM kernel hangs after "loop: module loaded"

The pull worked. The next step was `ctr run`:

```
VM "…" didn't start within 1m0s: failed to dial the VM over vsock: context deadline exceeded
```

The daemon serial console output (logged as `vmm_stream=stdout`) showed the Linux kernel
booting up to `loop: module loaded` at ~2.6 seconds and then going completely silent. No
userspace, no systemd, no panic.

The root cause was an orphaned devmapper snapshot from a previous failed run. A leftover
`fc-dev-thinpool-snap-N` device was still registered, and the shim's attempt to create a new
snapshot for the rootfs drive silently failed. Firecracker booted with no root drive, so the
kernel stalled waiting for `/dev/vda`.

**Fix:** list and remove orphaned snapshots before retrying:

```bash
sudo dmsetup ls
# fc-dev-thinpool       (253:0)
# fc-dev-thinpool-snap-3  (253:1)   ← orphan

sudo dmsetup remove fc-dev-thinpool-snap-3
sudo rm -rf /var/lib/firecracker-containerd/shim-base/default#<old-vmID>
```

After cleanup, the VM booted all the way to systemd.

> One thing to keep in mind: the thin-pool and loop devices are lost on host reboot.
> Re-running the `losetup` + `dmsetup create` commands is required after each restart.

---

## 🚨 Error 5: guest agent exits with code 1 — vsock EOF

With a clean state the VM now reached systemd and started the `firecracker-agent.service`.
The daemon side showed rapid `EOF` errors instead of the previous `i/o timeout`:

```
attempt=514 error="vsock ack message failure: failed to read \"OK <port>\" within 1s: EOF"
```

`EOF` instead of `i/o timeout` is meaningful: the guest agent was connecting to the vsock and
then immediately dying, rather than never connecting at all.

Systemd inside the VM confirmed this:

```
systemd[1]: Started Firecracker VM agent.
systemd[1]: firecracker-agent.service: Main process exited, code=exited, status=1/FAILURE
```

But no error message from the agent itself. To capture it we modified the service's `ExecStart`
to redirect output directly to `/dev/console` (bypassing the journal, which was not forwarding
the agent's output reliably):

```ini
ExecStart=/bin/sh -c '/usr/local/bin/agent --debug >/dev/console 2>&1; echo "agent exit $?" >/dev/console'
```

Since `default-rootfs.img` is a squashfs (read-only by design) we had to repack it:

```bash
unsquashfs -d /tmp/fc-rootfs /var/lib/firecracker-containerd/runtime/default-rootfs.img
# edit /tmp/fc-rootfs/etc/systemd/system/firecracker-agent.service
mksquashfs /tmp/fc-rootfs \
  /var/lib/firecracker-containerd/runtime/default-rootfs.img \
  -comp gzip -noappend -force-uid 0 -force-gid 0
```

The next run revealed the actual error:

```
/usr/local/bin/agent: /lib/x86_64-linux-gnu/libc.so.6: version `GLIBC_2.32' not found
/usr/local/bin/agent: /lib/x86_64-linux-gnu/libc.so.6: version `GLIBC_2.34' not found
agent exit 1
```

---

## 🚨 Error 6: glibc version mismatch in the guest agent

The `agent` binary inside `default-rootfs.img` was compiled on a Debian Bookworm/Ubuntu 22.04
host (glibc ≥ 2.34). The rootfs ships Debian Bullseye, which has glibc 2.31.

Go binaries are statically linked when compiled with `CGO_ENABLED=0`. Our binary was not — it
had been built without that flag, picking up a dynamic dependency on the host's glibc.

**Fix:** rebuild the agent statically and inject it into the rootfs:

```bash
# In the firecracker-containerd source tree
cd agent
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o agent-static .

# Inject
unsquashfs -d /tmp/fc-rootfs \
  /var/lib/firecracker-containerd/runtime/default-rootfs.img
cp agent-static /tmp/fc-rootfs/usr/local/bin/agent
mksquashfs /tmp/fc-rootfs \
  /var/lib/firecracker-containerd/runtime/default-rootfs.img \
  -comp gzip -noappend -force-uid 0 -force-gid 0
```

---

## ✅ It works

After the static rebuild:

```
$ sudo firecracker-ctr \
    --address /run/firecracker-containerd/containerd.sock \
    run --snapshotter devmapper --runtime aws.firecracker \
    --rm --tty docker.io/library/busybox:latest busybox-test
/ #
```

A busybox shell inside a Firecracker microVM, booted from an OCI image via firecracker-containerd.

---

## 📋 Summary of fixes

| Error | Root cause | Fix |
|---|---|---|
| `snapshotter not loaded: naive` | naive snapshotter daemon not running | Switch to `devmapper` |
| `snapshotter not loaded: devmapper` | `dmsetup` not in PATH for the daemon process | Launch with explicit `PATH=…:/sbin:/usr/sbin` |
| Kernel hangs at `loop: module loaded` | Orphaned devmapper snapshot blocks rootfs drive creation | `dmsetup remove` + `rm -rf` shim directory |
| `vsock: EOF`, agent exits 1 | Guest agent dynamically linked against newer glibc than rootfs provides | Rebuild agent with `CGO_ENABLED=0` |

---

## 🔭 What's next

The remaining step is wiring this up to the Mikrom API. The `firecracker-agent` gRPC service
already delegates VM lifecycle to containerd — the `manager.go` calls `ctrd.Pull` and
`ctrd.NewContainer` with the `aws.firecracker` runtime. Now that the underlying stack is
verified working, the integration test suite can run against a real VM instead of mocks.

The full host setup procedure is documented in
[`firecracker-agent/docs/host-setup.md`](https://github.com/spluca/firecracker-agent/blob/main/docs/host-setup.md).
