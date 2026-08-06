---
layout: ../../layouts/BlogLayout.astro
title: "Mikrom August 2026 Update"
description: "A recap of Mikrom's work since July 10: production-grade Infrastructure as Code (Terraform for GCP and AWS, Debian packaging, Ansible, and a Ceph-backed storage layer), real-time log streaming and metrics, IPv6/eBPF and DNS networking fixes, and security hardening."
tags: ["terraform", "ansible", "ceph", "rust", "eBPF", "observability", "microVM"]
time: 8
featured: true
timestamp: 2026-08-06T12:00:00+02:00
filename: mikrom-august-2026-update
---

# Mikrom August 2026 Update

The past few weeks have been about something quieter than a headline feature: turning Mikrom from a platform that *runs* into a platform that can be **stood up, packaged, and operated** like real production infrastructure. The change is not a headline feature but a shift in the project's center of gravity. What was delegated to ad hoc startup scripts and hand-rolled deployment steps is now expressed as infrastructure as code, shipped as Debian packages, and deployed with Ansible and Terraform across GCP and AWS.

That shift matters because it changes who Mikrom can be trusted by. A platform remains a prototype as long as only its author can bring it up. The work this month is the work that lets a second engineer clone the repository, run the playbooks, and get a working platform without a call to the person who wrote it.

## Production infrastructure, written as code

The most important thread of this sprint is that Mikrom's deployment story graduated from scripts to infrastructure as code.

On **Google Cloud**, the deployment system was rebuilt on **Terraform**. The VM provisioning is now idempotent, which means re-running the apply no longer risks a half-broken host. The base image moved to **Debian 13 (trixie)**, and the startup flow provisions the whole microVM toolkit eagerly: Firecracker, Jailer, Cloud Hypervisor, the Ceph client libraries, and Zig for the NAT64 toolchain. Two niceties show the care going into this: the startup script resolves and downloads the latest Firecracker kernel from AWS S3 on demand instead of pinning a stale artifact, and ACME/TLS handling is configurable so staging certificates are not accidentally produced in production. Managing the platform's own database now goes through **Cloud SQL with PostgreSQL 17**, and a dedicated `update-production.sh` script automates the roll-out.

An **AWS Terraform module** followed, mirroring the GCP playbooks so the platform is not hostage to a single cloud's quirks.

Alongside Terraform, an **all-in-one Ansible playbook for Debian 13** was added, and it is deliberately idempotent: playbook tasks can be rerun safely, which is the property that makes automation trustworthy in the first place. That playbook covers the platform's storage ambition too, with a **Ceph cluster playbook** and a local **OCI registry role** so workloads can be served without depending on a third-party container host. A pinned **railpack** release handles the source-driven builds that turn Git repositories into runnable artifacts.

The clearest sign of maturation, though, is packaging. The components are now shipped as **Rust-built Debian packages** and deployed through Ansible, aligning a consistent install story across the whole workspace. Gathering every service into a package is the kind of unglamorous work that turns a set of binaries into a deliverable system.

The reason this is the headline is simple: after this sprint, Mikrom is reproducible. The infrastructure is not remembered — it is written down, versioned, and runnable by someone who was not there.

## Observability that feels real-time

The operational side of a platform only works if operators can see what is happening while it happens. Mikrom closed the gap between polling and live.

**Real-time log streaming** was built on **Server-Sent Events (SSE)**, but with the details that make it real rather than lovely: unbuffered proxy headers so logs arrive as they are produced, **exponential backoff** so a flapping workload does not take the connection down with it, and multiline parsing so output is delivered as whole log records instead of arbitrary chunks. Those are the kind of decisions that are invisible in a demo and essential in a deployment.

That streaming was paired with a **CLI deployment watcher** and **Svelte 5 reactive status**, so both the terminal and the dashboard update as a deployment progresses instead of waiting for a page refresh. Readiness probes tie the health story together, so the platform has a shared idea of when a service is actually ready.

Storage got the same treatment. The **volume detail page now shows real RBD usage metrics** in real time, drawn from the Ceph-backed storage layer, instead of a placeholder. Live numbers change how users treat a dashboard: they can trust it as a source of truth rather than a stale poster.

## Networking tightened, not rebuilt

Most of the networking work this month was not about new features. It was about the small, precise fixes that make a mesh worth trusting.

The **eBPF egress firewall** finally stopped dropping **IPv6 ICMPv6 pings and NDP traffic**, which is the difference between IPv6 that appears to work and IPv6 that actually works on the wire. The internal DNS service stopped fighting with `systemd-resolved` by disabling its `DNSStubListener` to free port 53, so name resolution no longer collides with the platform's own messages.

The coordination layer was normalized too: NATS subjects were aligned between the API and the app, and the deployment logs stream was cleaned up so logs land in one consistent place. Two smaller runtime fixes round it out — the control plane now **falls back to the previous deployment's hypervisor** when the field is omitted, and the `mikrom-init` status code type was corrected for compatibility. None of this is flashy. All of it is the difference between a mesh that mostly works and one that can be relied on.

## Security as a product decision

Security work this month is less a list of patches and more a posture: credentials and attack surfaces were treated as design concerns, not afterthoughts.

User registration now includes a **stateless captcha**, keeping signups honest without coupling the control plane to an external verification service. And the deployment settings page no longer carries **Environment Variables and Secrets** in the UI, shrinking the surface where credentials are displayed and edited.

The largest statement, though, was made in the repository itself. Secrets were **cleaned out of the repo**, a **CI secret audit** was added, and the **builder was hardened against SSRF**. That is the difference between security that is spoken about and security that is written into the pipeline: the build path that turns source into images is now treated as a capability that must be constrained, not assumed safe. A design spec was committed alongside the work, because an improvement is only durable when the reasoning behind it is recorded.

## Billing matures to a sandbox

The commercial surface grew up a little. Mikrom is now wired to the **Polar.sh sandbox** for billing, which lets subscription flows be tested against a real integration without real money moving. The **Payments settings section was redesigned** around a standard card layout and subscription info, and **archived Polar products are skipped** in the billing listing so stale plans do not confuse the UI.

It is small, but it means the metering and subscription story is being treated with the same care as the runtime — a good sign that the platform is growing into a product.

## Toolchain and hygiene

Finally, a round of deliberate maintenance keeps the workspace healthy. The CI moved to **pnpm 11** and **Node 24 LTS**, and deprecated config was migrated so the pipeline runs on current tooling. A large but targeted dependency refresh landed — `jsonwebtoken 11`, `async-nats 0.50`, `aya-ebpf 0.2`, `rtnetlink 0.21`, `rand 0.10`, `x25519-dalek 3`, and others — and where a bump threatened the workspace build, it was reverted rather than forced through.

Worth calling out separately: the largest PR of the sprint went through a full **CodeRabbit review round-trip**, with the review feedback applied before the security work it touched was merged. A tool that enforces a second pair of eyes is an efficient way to keep quality from drifting when momentum is high.

## In short

Mikrom looks the same on the surface, but it is a different platform underneath. It can now be brought up reproducibly with Terraform and Ansible, packaged as Debian packages, served from a Ceph-backed storage layer, watched through live log streaming and volume metrics, and secured at the repository level rather than the feature level.

The shift this month is one of gravity, from a set of components into the single thing those components are building toward: a platform that someone else can stand up, operate, and trust. A platform is only as trustworthy as the story that gets it running — and that story is now written down, versioned, and reproducible. That coherence is the whole point, and the main story now.