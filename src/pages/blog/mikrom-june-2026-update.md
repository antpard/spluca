---
layout: ../../layouts/BlogLayout.astro
title: Mikrom June 2026 Update 
description: Mikrom June 2026 Update
tags: ["firecracker", "cloud-hypervisor", "rust", "mikrom", "6PN", "Neon", "Dagger"]
time: 11
featured: true
timestamp: 2026-06-02T08:15:00+00:00
filename: mikrom-june-2026-update
---

# Mikrom June 2026 Update

Mikrom is no longer just a deployment idea. It is a Rust-first platform-as-a-service with a complete workspace around it: control plane, routing plane, network services, a dashboard, a CLI, a builder, a scheduler, microVM bootstrapping, eBPF support, and a [Dagger](https://dagger.io/)-backed CI system that keeps the whole thing reproducible.

The current shape of the project is important because it shows a platform that is trying to own the full lifecycle of an app, not only the final deployment step. From source code to OCI image, from scheduler decision to microVM runtime, from internal DNS to ingress routing, Mikrom is designed as a coherent system.

## What is in the workspace

The repository is broad by design, and each component has a clear role:

- `mikrom-api`: the control plane API for auth, app lifecycle, deployments, secrets, and database provisioning.
- `mikrom-app`: the SvelteKit dashboard used to operate the platform from the web.
- `mikrom-cli`: the command-line client for users who prefer a terminal workflow.
- `mikrom-builder`: the build engine that turns Git repositories into OCI images.
- `mikrom-scheduler`: the placement and resource coordination layer.
- `mikrom-agent`: the worker daemon that manages microVM lifecycle, host coordination, and metrics.
- `mikrom-agent-ebpf`: the eBPF program used by the agent data plane.
- `mikrom-agent-ebpf-common`: shared types between the agent and the eBPF program.
- `mikrom-network`: the WireGuard-based mesh and network coordination service.
- `mikrom-dns`: the internal DNS service for platform and workload discovery.
- `mikrom-init`: the init binary that boots workloads inside microVMs.
- `mikrom-router`: the [Pingora](https://blog.cloudflare.com/how-we-built-pingora-the-proxy-that-connects-cloudflare-to-the-internet/)-based ingress router and traffic plane.
- `mikrom-proto`: shared protobuf definitions and generated Rust code.
- `ci`: the Rust-based Dagger runner that powers local and CI validation.

That layout makes the architecture easy to read: the control plane decides, the builder produces, the scheduler places, the agent runs, the router receives traffic, and the network services keep the system connected.

## The stack behind it

Mikrom is intentionally Rust-heavy, but the stack is broader than that. The repo currently leans on:

- Rust 2024 for the backend and infrastructure services.
- Tokio for async execution.
- Axum for the API layer.
- SQLx for database access.
- async-nats for messaging and coordination.
- reqwest for HTTP integrations.
- tracing and OpenTelemetry for observability.
- Pingora for the router.
- SvelteKit, Svelte 5, Vite, Tailwind CSS 4, shadcn-svelte, bits-ui, Lucide, Vitest, and Playwright for the dashboard.
- Firecracker and Cloud Hypervisor for microVM execution.
- PostgreSQL, Neon, and NATS for the platform data plane and coordination.
- Docker Compose, BuildKit, Dagger, and GitHub Actions for local development and CI/CD.

That mix matters. Mikrom is not using Rust as a branding choice; Rust is the glue for a system that spans API services, worker processes, networking, and build automation.

## PostgreSQL through Neon

One of the clearest product signals in the repository is the way databases are handled. PostgreSQL is provisioned through [Neon](https://neon.com/), and when workloads are deployed on the platform, the database runs in Cloud Hypervisor-backed microVMs.

That combination is elegant for two reasons. First, it avoids treating the database as an afterthought. Second, it keeps the platform’s story consistent: applications, control plane services, and supporting data services all fit into the same microVM-oriented model.

For a platform like Mikrom, that makes a lot of sense. The user sees a simple deployment flow, but underneath, the system still preserves isolation and a clean operational boundary.

## Networking: practical, IPv6-first, and inspired by 6PN

The networking story is one of the most interesting parts of Mikrom right now. The platform already has a WireGuard mesh, internal DNS, and route synchronization, but the design direction goes further than that.

The [6PN approach](https://fly.io/docs/networking/private-networking/) from fly.io has clearly been an important inspiration for Mikrom’s IPv6 mesh thinking. That influence shows up in the emphasis on private addressing, mesh connectivity, and a network model that makes services easier to discover and connect without turning the system into a tangle of ad hoc tunnels.

In practice, that means Mikrom is trying to build a mesh that is:

- private by default;
- service-oriented rather than host-oriented;
- compatible with workload discovery;
- and aligned with the way the platform already handles routing and internal name resolution.

The important part is not that Mikrom copies another design. It is that it borrows a proven mental model and adapts it to its own control plane, agent, and DNS architecture.

## The product surface has also matured

Mikrom is not only infrastructure. The dashboard and CLI show that the project is being shaped for day-to-day use.

The web app is built with SvelteKit and the modern Svelte ecosystem, which gives the project a current frontend story instead of a legacy admin interface. The CLI complements that with a more direct workflow for users who want to stay in the terminal. Together, they make the platform accessible from both the browser and the shell.

That is a meaningful distinction. A platform becomes much easier to adopt when its operational surface is not limited to a single interface style.

## CI as part of the platform

The recent engineering work in the repository points in a very deliberate direction: validation is being treated as part of the product.

The Dagger-based CI runner in `ci/` is now the shared source of truth for local validation and GitHub Actions. That reduces drift, keeps pipeline logic in Rust, and makes the project easier to reason about. It also helps the workspace scale because each service can be validated in a consistent way without duplicating logic across YAML files and ad hoc scripts.

The latest changes also show the kind of operational hardening that a growing platform needs:

- better readiness checks for shared services;
- more robust NATS interaction in builder tests;
- longer, more realistic timeouts;
- and clearer handling of components that need special treatment in the test matrix.

This is not flashy work, but it is the work that makes a platform trustworthy.

## What Mikrom looks like now

The current state of Mikrom is a project moving from architecture into system behavior.

It has:

- a clear component map;
- a modern frontend and a usable CLI;
- microVM-based isolation with Firecracker and Cloud Hypervisor;
- PostgreSQL deployment through Neon;
- a network model shaped by WireGuard, DNS, and 6PN-inspired IPv6 thinking;
- and a CI pipeline that is meant to behave the same way everywhere.

That combination is what makes the project interesting right now. Mikrom is not just assembling infrastructure parts. It is aligning them into a platform that can be operated, validated, and extended without losing its shape.

## In short

Mikrom today is a Rust PaaS with a real workspace behind it, a modern stack, a clean separation of concerns, PostgreSQL provisioned through Neon, and a network direction influenced by fly.io’s 6PN model. The project’s direction is clear: build a platform that feels coherent from the CLI to the control plane, from the router to the mesh, and from local development to CI.

That coherence is the main story now.
