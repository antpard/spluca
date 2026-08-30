---
layout: ../../layouts/BlogLayout.astro
title: "Mikrom Is Close to Production"
description: "Since the August update, Mikrom closed the gaps between a reproducible platform and one you can trust with someone else's workload: a Cloudflare edge that replaces the hand-rolled ACME stack, a fully self-hosted Neon storage plane on Ceph, a security posture instead of a patch list, an audit trail, and reliability fixes under the microVMs. What's left is the multi-tenant product surface."
tags: ["cloudflare", "neon", "postgres", "security", "observability", "microVM"]
time: 8
featured: true
timestamp: 2026-08-30T12:00:00+02:00
filename: mikrom-close-to-production
---

# 🚀 Mikrom Is Close to Production

The [August update](/blog/mikrom-august-2026-update) argued that Mikrom had graduated from a platform that *runs* to one that can be **stood up, packaged, and operated** — reproducible with Terraform and Ansible, shipped as Debian packages, served from Ceph-backed storage. That was the shift from "only its author can bring it up" to "a second engineer can clone the repo and get a working platform."

Reproducible is not the same as production. A platform you can rebuild from source is still not a platform you would put a stranger's workload on. The weeks since have been about that last gap: cutting the remaining external dependencies, turning security from a list of fixes into a posture, and giving operators a paper trail. None of it is a headline feature. All of it is what "production" actually means.

## 🌍 An edge that isn't hand-rolled

Mikrom used to run its own public ingress edge. `mikrom-router` served TLS certificates from a `tls_certificates` table, and `mikrom-api` ran an ACME worker that answered Let's Encrypt HTTP-01 challenges over NATS. It worked, but it was a security-sensitive subsystem the project had to maintain itself, and it was the only thing standing between the open internet and the origin host.

That whole layer is now **Cloudflare**, and the interesting part is that ACME was **deleted, not adapted**. Once Cloudflare proxies a hostname, the HTTP-01 challenge is answered by Cloudflare's edge and never reaches the origin, so the old flow could not survive the move. The `acme.rs` module, the `tls_certificates` and `acme_challenges` tables, the master key the router used to decrypt certificate material, and the corresponding proto messages were all removed. Less code, and the code that is gone is exactly the code you least want to be responsible for.

The request path changed shape too. `mikrom-router` no longer has a public listener on `:80` or `:443`; it binds `127.0.0.1:8080` and nothing else. Traffic reaches it through `cloudflared`, which makes an **outbound** tunnel to Cloudflare and forwards requests to that loopback port. The origin host has no public inbound ports, no firewall rules for Cloudflare IP ranges, nothing for an attacker to reach directly. DDoS traffic terminates at the edge. Creating or deleting an app requires zero Cloudflare changes, because a single proxied wildcard record and one static ingress rule already cover every app hostname — the router still resolves the specific backend from its `routes` table, fed by the control plane over NATS exactly as before.

The same migration moved the inbound webhooks (GitHub, Polar) onto Cloudflare Workers, and the dashboard at `mikrom.spluca.org` is now served directly by Workers rather than through the app path. The self-hosted execution plane — scheduler, agent, `mikrom-init`, the eBPF data plane, builder, NATS, the WireGuard mesh, internal DNS — is untouched. Cloudflare terminates and protects traffic; it does not run workloads.

## 🐘 The database stopped phoning home

Mikrom provisions PostgreSQL through Neon, which gives it branching, snapshots, and separation of storage from compute. Until now that meant a dependency on Neon's hosted control plane. That dependency is gone: the **storage plane is self-hosted**.

`storage_broker`, `pageserver`, and `safekeeper` now run on a dedicated VM, installed from a `mikrom-neon` Debian package via a `mikrom_neon` Ansible role, with Ceph RADOS Gateway (S3) underneath as the durable object store. A separate pipeline builds the **compute root filesystem** for the Postgres microVMs — the image `mikrom-init` boots to bring a database instance up — with its own build target, CI subcommand, KVM-gated boot smoke test, and rollback runbook.

Self-hosting the storage plane means owning its durability story, so that landed alongside: bucket **versioning** with a noncurrent-object expiry lifecycle, a `storage_scrubber` timer that runs `pageserver` scan-metadata on a schedule, **R2 disaster-recovery** timers that push a second copy off the primary Ceph cluster, and a written backups/DR runbook with recovery procedures. A database platform is only as good as the day you have to restore it, and that day now has a document.

## 🔐 Security moved from feature to posture

The August update treated security as a product decision. This stretch turned that into a coordinated pass — enough of one that it has its own branch, `hardening/production-wave-0`.

On the repository: secrets were purged from history, a **gitleaks secret audit** was added as a CI stage, and the **builder was hardened against SSRF** so the path that turns a Git URL into an image cannot be pointed at internal services. On the control plane: secret encryption keys are now derived via **HKDF with a per-message salt** instead of used directly; personal access tokens are stored as a **peppered HMAC** rather than a plain hash; JWTs can be **revoked** through a per-user `token_version`; refresh tokens **rotate on use with reuse detection**; and CORS is restricted to configured browser origins instead of reflecting anything.

The other half of the posture is refusing to start wrong. `mikrom-api` now fails fast when Neon credentials are missing but provisioning is enabled; `mikrom-agent` fails fast when its host identity key is absent; Ansible fails the deploy when Polar billing secrets are not present. A service that will not run without its security-relevant configuration cannot be quietly misconfigured into production.

## 🧾 A control plane that remembers

Two roadmap items from Phase 1 landed together. There is now an `audit_logs` table with a proper domain model and a Postgres-backed repository, and audit records are written on the mutating control-plane actions — who did what, to which resource, from where, when. It is append-only and stored on its own, not folded into `deployments`.

Alongside it, the API surface started becoming a **documented one**: a `GET /v1/audit-logs` endpoint shipped with OpenAPI metadata, using `aide` to generate the spec from the handlers rather than maintaining it by hand. That is the seed of the public API the roadmap needs for SDKs, CI/CD integrations, and eventually an MCP server — but the immediate value is that operators can answer "what changed" without reading logs.

## 🧱 Reliability under the VMs

A production platform fails in the boring middle layer, so a lot of small fixes went into the agent and scheduler. Firecracker crash recovery and startup races were repaired. VM boot time is now **bounded**, and the agent surfaces a real app-started status instead of assuming a booted VM is a working one. Transient Firecracker API failures are **retried with backoff**. Jobs whose app never confirms startup now **fail** instead of hanging. Scale-up-from-zero failures are surfaced rather than silently no-opped.

The nastiest class of bug was VMs dying when they should not: the agent used to kill running VMs on every shutdown, and a restart could orphan or leak them. Firecracker VMs now **survive agent restarts**, leaked VMs get cleaned up, and the beta cleanup path no longer deletes apps that are still desired. On the network side, WireGuard mesh routes stopped shadowing local VM traffic, the bridge MAC is pinned so it stops drifting under running VMs, and stray host routes that raced a VM's local route are evicted. `mikrom-api` also drains in-flight requests on shutdown instead of cutting them.

## 💳 Billing for real, and a front door

The commercial surface stopped being a rehearsal. Polar moved from the **sandbox catalog to production**, with production credentials persisted — subscription flows now run against the real integration.

There is also a front door now: a dedicated **landing site** (`mikrom-landing`), built as a launch path with visual deployment diagrams and an explicit European digital-sovereignty position — "a real isolated runtime, a durable release history, managed ingress, private networking," and no slideware. It is backed by a **marketplace** of one-click reference apps (Vaultwarden, Excalidraw, and more) with a template catalog and a deploy-from-template flow in the dashboard. And the dashboard itself went through a full **mobile pass** — bottom navigation, card layouts replacing tables, bottom-sheet modals, 44px touch targets — so the platform is operable from a phone, not just a laptop.

## 🚧 What "close" still means

Close is not done, and the Cloudflare design doc says the quiet part out loud: "with no real tenants yet." The gaps that remain are all about the multi-tenant product surface, not the runtime:

- **RBAC and project roles.** Projects are already the tenant boundary, but a team cannot share one without handing out owner credentials. Roles and invitations are the blocker for a second user.
- **Tenant custom domains.** The router does TLS-via-Cloudflare and the wildcard covers `*.apps.spluca.org`; what is missing is the user-facing flow to verify and attach your own domain.
- **Alerting.** Logs and metrics stream, but nothing turns "deployment failed" or "volume at 90%" into a notification. Observability is still passive.
- **The outbound event bus.** The API receives webhooks; it does not yet emit signed `deployment.deployed` / `database.ready` events. That one enabler unblocks alerting, CI/CD integrations, and proactive automation.
- **Per-app cost visibility.** Billing is aggregate. Cost per deployment, database, and volume — plus soft quotas — is what makes the platform's economics legible.

## ✅ In short

Since August, Mikrom cut its last hard external dependencies. The public edge is Cloudflare instead of a hand-maintained ACME stack, and the origin has no public socket at all. The database storage plane is self-hosted on Ceph, with backups, a scrubber, off-site DR, and a restore runbook. Security is a coordinated wave — repo, crypto, tokens, and fail-fast startup — rather than a changelog of patches. There is an audit trail and the beginning of a documented API. The agent stopped killing its own VMs. Billing is on the production catalog, and there is a landing site and a marketplace in front of it.

What is left is the shape of a product for more than one person: roles, domains, alerts, an event bus, cost. That work is well-scoped and mostly additive — extend `mikrom-api`, touch the router and agent lightly, no rewrite. The hard, unglamorous part, the part that makes a platform trustworthy rather than merely reproducible, is now behind us.
