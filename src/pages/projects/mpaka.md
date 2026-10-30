---
layout: ../../layouts/ProjectLayout.astro
title: mPaka
description: API-first control plane for isolated code execution, built in Rust around durable execution records, explicit executor boundaries, and evidence-based admission.
tags: ["Rust", "Axum", "PostgreSQL", "Firecracker", "Sandboxing", "SvelteKit"]
liveUrl: https://mpaka.dev
githubUrl:
featured: true
timestamp: "2026-10-30"
filename: mpaka
---

mPaka is a control plane for isolated code execution. It answers a specific question: when a product needs to run code it cannot trust—submitted by an AI agent, an end user, or a pipeline—where should that code run, and what record should exist afterwards?

The usual answer is "a sandbox". mPaka treats that as only part of the problem. Before isolation matters, the system needs a durable execution record, explicit lifecycle states, clear boundaries between the API, the scheduler, the host agent, and the executor, and enough evidence to explain what happened when a workload fails, times out, or disappears with its host. mPaka is the commercial name for the project; RustBox remains the internal repository and technical namespace.

The project is in private beta, and it is deliberately precise about its own maturity. The default executor returns `mode: "mock_no_code_execution"`, which is positive proof that submitted source was *not* run. The control-plane workflow is exercised end to end without claiming to be a production sandbox.

## What the repository includes

The workspace is a Rust 2024 Cargo workspace with a strict separation between domain rules, orchestration, and execution:

- `domain`: validation, lifecycle states, resource limits, and records, with no HTTP or runtime concerns.
- `application`: repository ports, the PostgreSQL adapter, in-memory test adapters, submission, lookup, assignments, leases, reservations, cancellation requests, and conditional completion.
- `executor`: the `Executor` port, the versioned `rustbox.executor.v1` manifest and response contract, bounded validation, the authenticated client boundary, and safe mock implementations.
- `api`: Axum HTTP DTOs, authentication, error mapping, configuration, migrations, and startup.
- `scheduler`: an independent placement engine with host-capacity and host-health selection.
- `worker`: host-agent registration, directed claims, local execution, fencing, and signal-driven shutdown.
- `executor-service`: the standalone service that speaks the authenticated executor protocol, with a safe mock runtime by default and a feature-gated Firecracker backend.

Around the Rust workspace sit a SvelteKit web console for accounts, API keys, and execution history, an Astro landing and documentation site, a CLI for submitting and following executions, and the Ansible, Debian packaging, and CI machinery used to run the merge gate on a self-hosted Linux runner.

## How an execution moves through the system

1. A client submits a bounded job to `POST /v1/executions` with a language, source, resource limits, a deadline, and a tenant-scoped `Idempotency-Key`.
2. The API validates the request against domain rules and returns HTTP 202 only after PostgreSQL commits the execution *and* its resource reservation.
3. The scheduler atomically creates a historical assignment and reserves host slots and memory before moving the execution to `assigned`.
4. A host agent claims only assignments for its own host session, then acquires the execution lease.
5. The agent hands the job to its local executor service across the explicit protocol boundary.
6. The result is written back through the current fencing token, and `GET /v1/executions/{id}` returns the status and a safe result projection.

The lifecycle vocabulary is explicit—`queued`, `assigned`, `leased`, `provisioning`, `running`, then `completed`, `failed`, `timed_out`, or `cancelled`—and every transition is meant to be inspectable rather than inferred.

## Durability, recovery, and the execution contract

PostgreSQL is the source of truth, not process memory: restarting the API does not lose accepted executions, and there is no fallback to ephemeral storage when the database is unavailable. Workers claim rows with a lease and row locking, so an expired lease can be recovered by another worker.

Generation counters, assignment fencing, lease tokens, and conditional completion exist to stop a stale scheduler or a stale agent from overwriting a newer attempt. Cancellation is treated as a contract rather than a best-effort signal: the API records a durable request, the owning agent detects it, asks its local executor to stop, and only the current fencing token may complete the transition. Ambiguous host failures require fencing and reconciliation before a replacement attempt, instead of silently re-running work that might still be live.

The internal protocol carries the durable execution ID, a fresh request ID and nonce, validated limits, an absolute deadline, the source, and an output bound. Responses must echo the identity fields and satisfy outcome-specific rules before a worker will map them to a result. The authenticated fake used in tests records replayed request and nonce pairs—and never interprets source.

Alongside this, the control plane supports tenant-owned executions, provisional concurrency, rate and budget limits, durable audit events, and database-backed API keys that can be listed as metadata, revoked, and rotated, with bearer tokens returned only once at creation.

## Isolation as something to be earned

The executor port is the seam where real isolation will live. A `firecracker` Cargo feature configures one ephemeral microVM through the Firecracker Unix API and exchanges a bounded request over a vsock guest channel, with rootfs artifacts verified against a pinned manifest before the listener accepts traffic and a host-local reconciler that removes only jails whose PID still matches the expected command line.

That backend stays explicitly selected and disabled for untrusted input. Enabling it requires recorded evidence for one ephemeral VM per request, idempotent teardown, every resource limit, no default network or host secrets, cleanup after crash, failure, timeout, and cancellation, and protocol replay and fencing tests. Operational evidence is kept in the repository, separate from release claims: a Firecracker acceptance report, a supervised load procedure, a runbook, and drill checks that must pass before an evidence directory is shared. Missing privileged or independent-review evidence remains a blocker rather than a footnote.

Real execution must be a separate privilege boundary. It must never be a host process spawned by the API or the worker.

## Validation

- `cargo fmt`, `cargo nextest run --workspace`, and `cargo clippy --all-targets -D warnings` as the baseline.
- `make audit` with `cargo-audit`, failing on any advisory outside one narrowly documented inactive-optional exception.
- Compose-backed PostgreSQL integration tests that create a unique schema per run instead of resetting a development database.
- A merge gate on a self-hosted Linux runner, with separate `ci-stress` and `ci-firecracker` targets for the privileged and load-oriented evidence paths, including `/dev/kvm` validation inside the job.

## What this project is not

mPaka has no production TLS deployment, billing, production artifact-retention policy, or real isolation of untrusted code today. Tenant ownership, API-key lifecycle, provisional quotas, reservations, and idempotency improve control-plane integrity; they do not make submitted code safe to execute. The protocol's mTLS contract is documented but not provisioned by local startup, and the current remote transport uses a bearer credential over HTTPS, which is not equivalent to mutual TLS.

Before any real untrusted execution, mPaka needs a hardened Firecracker/KVM executor, immutable guest images, default-deny networking, enforced resource limits, retention policies, abuse controls, and independent security testing. Stating that plainly is part of the design.

## Case study: designing a boundary before a sandbox

### The engineering challenge

Products that run untrusted code tend to reach for a sandbox first and discover the hard parts later: retries that duplicate jobs, cancellations that never arrive, hosts that vanish mid-execution, and results that nobody can trace back to the runtime that produced them.

### The approach

mPaka inverts the order. It makes the execution contract the product: durable records in PostgreSQL, an independent scheduler with explicit reservations, host-directed agents with leases and fencing, a versioned protocol at the executor boundary, and a default mode that proves code was not run. Isolation is then a backend chosen and validated behind that seam, admitted on evidence rather than on a polished interface.

This is the kind of work covered by [cloud architecture and infrastructure](/services/cloud-architecture) and [backend development in Ruby, Go, and Rust](/services/backend-development): distributed state, failure modes, and operational boundaries treated as first-class design concerns.

### What the project demonstrates

The repository makes the full path visible—submission, validation, durable persistence, placement, leasing, cancellation, recovery, and a safe result projection—together with the acceptance criteria an isolated runtime must meet before it is trusted. mPaka is in private beta, so this case study describes engineering scope and architecture rather than claiming a customer result.

If your platform needs to run code it cannot trust, [contact me to discuss your execution boundary](/contact).
