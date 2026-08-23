---
layout: ../../layouts/BlogLayout.astro
title: "Mikrom: Update of the Last 15 Days"
description: "A comprehensive look at Mikrom's latest updates: two-factor authentication, Personal Access Tokens (PATs), Polar billing integration, CLI snapshot commands, agent stability, and Dagger-powered CI pipelines."
tags: ["rust", "security", "2FA", "Polar", "CLI", "eBPF", "Dagger", "microVM"]
time: 7
featured: true
timestamp: 2026-07-10T11:58:00+02:00
filename: mikrom-july-2026-update
---

# 🚀 Mikrom: Update of the Last 15 Days

Over the past two weeks, we have been working hard on the **Mikrom** ecosystem—our Rust-first platform-as-a-service for microVM workloads. Our focus during this sprint has been on hardening user account security, integrating a flexible billing and subscription system via **Polar**, expanding CLI capabilities for snapshots and databases, and improving the overall stability of our microVM agent and eBPF data plane.

Here is a detailed breakdown of the major changes introduced in this sprint.

---

## 🔒 1. Hardened Security: 2FA, PATs, and Account Settings

We have introduced several major security features to give users better control over their accounts and API access:

- **Two-Factor Authentication (2FA / TOTP):** Users can now enable 2FA under the Security settings tab (`/settings?tab=security`). This is fully integrated into the login flow and includes a clean modal displaying a QR code for quick scanning with Authenticator apps.
- **Personal Access Tokens (PATs):** We implemented the backend architecture and API endpoints for creating, listing, and revoking Personal Access Tokens (`/settings?tab=api`), enabling secure headless authentication for CLI tools and automation scripts.
- **Password Reset & Account Deletion:** Secure modal flows are now in place allowing users to update their credentials or delete their accounts safely.

---

## 💳 2. Polar Billing Integration

We have completed a deep integration with **Polar** to handle subscription tiers and usage tracking:

- **Plan Tiers & Entitlements:** Support for multiple subscription levels, usage tracking, and entitlement checks has been implemented to enforce deployment limits.
- **Webhook Idempotency & Lifecycle:** Added robustness to our billing webhook handler with support for Polar idempotency keys and new subscription lifecycle events, preventing duplicate processing.
- **Refreshed Payments UI:** The billing section has been renamed to *Payments*, featuring a polished layout with plans cards, subscription info, and clear tier details.

---

## 💻 3. CLI Upgrades (`mikrom-cli`)

The Mikrom Command-Line Interface has been updated with subcommands matching the new API capabilities:

- **Database Snapshots & Branching:** Easily create backups, perform restores, and branch Neon databases directly from the CLI.
- **VM Snapshots:** Added subcommands to capture and manage microVM volume snapshots for app deployments.
- **PAT & Notification Management:** CLI commands to generate or revoke personal access tokens and adjust user notification preferences.

---

## ⚙️ 4. Agent & Runtime Stability (`mikrom-agent` & eBPF)

The core microVM management daemon and network data plane have been optimized for high-availability workloads:

- **Cloud Hypervisor Recovery:** Fixed a process recovery stub leak in the Cloud Hypervisor driver and implemented **atomic state persistence** to ensure the agent state remains clean across daemon restarts.
- **Runtime Safety & Panic Mitigation:** Eliminated potential panics from `unwrap()`, `expect()`, or `unreachable!()` calls in retry loops. The agent and router now gracefully handle potential overflows, TAP leaks, and path-traversal scenarios.
- **eBPF Adaptations:** Updated the eBPF data plane (`mikrom-agent-ebpf`) to match the latest API changes in the `network-types 0.2.0` crate, and repaired IPv6 extension header parsing.

---

## 🛠️ 5. CI/CD & Developer Experience

Our testing and build pipelines received major stability and dependency upgrades:

- **Dagger-powered Jenkins Pipelines:** Expanded the `Jenkinsfile` to run a fully containerized pipeline using Dagger via a Docker-in-Docker (DinD) sidecar service, running tests and lints in parallel stages.
- **Dependency Upgrades:** Bumped multiple critical Rust crates (such as `async-nats` to `v0.49`, `jsonwebtoken` to `v10.4`, and `prost` to `v0.14`) to fix Dependabot alerts.
- **Stable Integration Tests:** Replaced live NATS connections with a `MockNatsClient` in integration suites to prevent spurious `ConnectionRefused` test failures.

---

> [!NOTE]
> All changes have been verified using our fast validation suite (`make ci-fast`) and full integration runs. Version `v0.4.5` is now live in production!
