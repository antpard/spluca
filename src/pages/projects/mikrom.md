---
layout: ../../layouts/ProjectLayout.astro
title: Mikrom
description: Rust-first edge platform for deploying containerized workloads into isolated Firecracker or Cloud Hypervisor microVMs.
tags: ["Rust", "MicroVMs", "Firecracker", "Cloudflare", "Dagger"]
liveUrl: https://mikrom.spluca.org
githubUrl:
featured: true
timestamp: "2026-08-29"
filename: mikrom
---

Mikrom is an open-source, Rust-first edge platform for deploying containerized workloads into lightweight Firecracker or Cloud Hypervisor microVMs. It combines a PaaS workflow with a self-hostable execution plane: source repositories become OCI images, images are scheduled onto workers, workloads run in isolated VMs, and external traffic reaches them through a Pingora-based router.

## What the repository includes

The workspace is a complete platform rather than a single backend service:

- `mikrom-api`: Axum control plane for authentication, tenants and projects, applications, deployments, secrets, PATs, audit logs, GitHub webhooks, billing, and database provisioning.
- `mikrom-app`: SvelteKit dashboard for deployments, logs, metrics, scaling, snapshots, storage, databases, networking, notifications, and account settings.
- `mikrom-cli`: Rust command-line client for app and deployment workflows, database operations, snapshots, PATs, and automation.
- `mikrom-builder`: source-to-OCI build service for Git repositories, backed by BuildKit and NATS.
- `mikrom-scheduler`: placement engine and cluster coordinator that assigns workloads to workers.
- `mikrom-agent`: worker daemon managing Firecracker and Cloud Hypervisor lifecycle, recovery, volumes, snapshots, logs, metrics, and host networking.
- `mikrom-agent-ebpf` and `mikrom-agent-ebpf-common`: eBPF data-plane program and shared types used by the agent.
- `mikrom-router`: Pingora ingress and traffic plane with health checks, WebSocket forwarding, and WireGuard-aware routing.
- `mikrom-network`: WireGuard mesh identity, peer state, and route synchronization.
- `mikrom-dns`: internal service and workload discovery with DNS64 support for IPv6-first environments.
- `mikrom-init`: Zig guest-init binary that boots the workload environment inside each microVM.
- `mikrom-proto`: shared protobuf contracts and generated Rust code for service communication.
- `mikrom-webhooks`: Rust Cloudflare Worker that verifies Polar webhook signatures and queues events before forwarding them to the API.
- `ci`: Dagger-backed Rust runner for local and GitHub Actions validation, packaging, image builds, and release flows.

## How a deployment moves through the platform

1. A user starts from the dashboard or CLI.
2. `mikrom-api` authenticates the request and records the application or deployment state in PostgreSQL.
3. `mikrom-builder` builds the Git repository into an OCI image and pushes it to the registry.
4. `mikrom-scheduler` selects a worker and coordinates with `mikrom-agent` over NATS.
5. `mikrom-agent` creates and supervises the workload's Firecracker or Cloud Hypervisor microVM.
6. `mikrom-router` resolves the route and forwards HTTP or WebSocket traffic over the WireGuard mesh.
7. `mikrom-network` and `mikrom-dns` provide host connectivity and internal name resolution around the workload.

The control plane and traffic plane remain separate: the API coordinates state and execution, while the router serves application traffic directly to the microVMs.

## Platform capabilities

Mikrom supports deployment presets for Phoenix, static sites, Ruby on Rails, Docker, Go, Rust, Django, Laravel, and JavaScript applications. The operational surface includes live logs and metrics, health checks, scaling, rollback and deployment history, runtime memory resize, persistent volumes, VM snapshots, database branches/backups/snapshots, GitHub deploy hooks, personal access tokens, notifications, and tenant-scoped authorization.

PostgreSQL databases can be provisioned through Neon and run through the same Cloud Hypervisor-backed workload path. Polar provides checkout, customer portal, subscriptions, entitlements, and usage-aware billing. Audit logs and request-boundary tests cover the control plane's security-sensitive operations.

## Edge and operations

The public edge now uses Cloudflare for TLS termination, WAF/rate limiting, CDN reach, and DDoS protection. `cloudflared` makes an outbound tunnel to the router host, where `mikrom-router` listens on a loopback HTTP port; the origin has no public application listener. The self-hosted execution plane remains on the platform: PostgreSQL, NATS, BuildKit, Firecracker, Cloud Hypervisor, Ceph, WireGuard, DNS/DNS64, NAT64, and the eBPF data plane are not moved into Cloudflare.

Ansible is authoritative for host configuration, environment files, systemd services, Firecracker and Cloud Hypervisor runtime dependencies, and Debian package installation. Terraform defines the Cloudflare edge boundary. OCI artifact exports to Cloudflare R2 are deliberately outside the builder hot path, with explicit retention, restore drills, and rollback gates.

## Current stack and validation

- Rust 2024 with Tokio, Axum, SQLx, async-nats, reqwest, tracing, and OpenTelemetry.
- Pingora for the ingress router; SvelteKit 2, Svelte 5, Vite, Skeleton, and Tailwind CSS 4 for the dashboard.
- Firecracker and Cloud Hypervisor for workload isolation; PostgreSQL, Neon, NATS, Ceph, WireGuard, and DNS64/NAT64 for platform services.
- Docker Compose, BuildKit, Ansible, Debian packaging, Terraform, Cloudflare Workers, and GitHub Actions for delivery.
- Dagger profiles for smoke, fast, full, audit, Debian, frontend, external integration, image, release, and Ceph-specific validation, with host-dependent Ceph tests kept separate from default CI.

## Recent direction

The recent Git history shows Mikrom moving from platform breadth toward production delivery and operational hardening: the dashboard was migrated to Skeleton and given stronger loading, accessibility, and error states; deployment history, rollback, snapshots, metrics, memory resize, and command-palette workflows were expanded; tenant isolation and security audit waves were added; and the public ingress was migrated to Cloudflare with managed domains, a tunnel, WAF controls, and R2 artifact restore procedures. The landing site now includes bilingual company pages, contact handling, a dark theme, and a dedicated documentation surface.

Mikrom is therefore both a working Rust cloud platform and an operations-focused infrastructure project: it covers the path from Git commit to isolated workload, while keeping deployment, observability, networking, security, and recovery visible in the repository.
