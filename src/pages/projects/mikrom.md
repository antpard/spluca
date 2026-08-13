---
layout: ../../layouts/ProjectLayout.astro
title: Mikrom
description: Rust-first platform-as-a-service for deploying containerized workloads into Firecracker or Cloud Hypervisor microVMs.
tags: ["Rust", "Firecracker", "Cloud Hypervisor", "NATS", "Dagger"]
liveUrl: https://github.com/spluca/mikrom
featured: true
timestamp: "2026-06-02"
filename: mikrom
---

Mikrom is a Rust-first platform-as-a-service for deploying containerized workloads into Firecracker or Cloud Hypervisor microVMs. The workspace is built around the full application lifecycle: code is built into OCI images, scheduled onto worker nodes, started inside microVMs, exposed through an ingress router, and supported by internal network and DNS services.

## What the workspace includes

The repository is organized as a full platform, not just a single service:

- `mikrom-api`: control plane API for auth, projects, applications, deployments, secrets, webhooks, and database provisioning.
- `mikrom-app`: SvelteKit dashboard for day-to-day platform operations.
- `mikrom-cli`: command-line client for terminal-based workflows.
- `mikrom-builder`: build service that turns Git repositories into OCI images.
- `mikrom-scheduler`: placement and cluster coordination layer.
- `mikrom-agent`: worker daemon that manages microVM lifecycle, metrics, logs, and host coordination.
- `mikrom-agent-ebpf` and `mikrom-agent-ebpf-common`: eBPF program and shared types for the agent data plane.
- `mikrom-router`: Pingora-based ingress router and traffic plane.
- `mikrom-network`: WireGuard mesh and route synchronization service.
- `mikrom-dns`: internal DNS service for platform and workload discovery.
- `mikrom-init`: init binary used inside microVM images.
- `mikrom-proto`: shared protobuf definitions and generated Rust code.
- `ci`: Dagger-backed local CI runner used for reproducible validation.

## Current shape

The current architecture is clear:

1. The user interacts through `mikrom-app` or `mikrom-cli`.
2. `mikrom-api` handles control-plane requests.
3. `mikrom-builder` produces the OCI image.
4. `mikrom-scheduler` chooses placement.
5. `mikrom-agent` launches and manages the microVM.
6. `mikrom-router` receives external traffic.
7. `mikrom-network` and `mikrom-dns` keep the platform connected and discoverable.

That separation keeps the platform understandable while still covering the full path from source code to running workload.

## Current stack

The workspace is intentionally Rust-heavy and uses a modern frontend stack where needed:

- Rust 2024 across the backend and infrastructure services.
- Tokio, Axum, SQLx, async-nats, reqwest, tracing, and OpenTelemetry in the Rust services.
- Pingora in the router.
- SvelteKit, Svelte 5, Vite, Tailwind CSS 4, shadcn-svelte, and bits-ui in the dashboard.
- Firecracker and Cloud Hypervisor for workload isolation.
- PostgreSQL, Neon, and NATS for persistence and coordination.
- Docker Compose, BuildKit, Dagger, and GitHub Actions for local and CI validation.

## Summary

Mikrom today is a cohesive Rust cloud platform built around microVM execution, a modern dashboard and CLI, internal networking and DNS services, and a Dagger-backed validation flow. The repo already shows a complete platform shape rather than an early prototype.
