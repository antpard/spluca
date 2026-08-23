---
layout: ../../layouts/BlogLayout.astro
title: "Log of a Week of Work on Scratch"
description: "A technical log of one week on Scratch: LLM-based extraction fallback and selector repair, JSON-API and RSS/Atom extraction paths, a worker-owned Chromium fixing bot-block failures, instant job dispatch via Postgres LISTEN/NOTIFY, a public OpenAPI document with TypeScript/Python SDKs, TOTP 2FA, and Polar.sh billing."
tags: ["Rust", "Axum", "Next.js", "PostgreSQL", "NATS", "LLM", "OpenAPI"]
time: 9
featured: true
timestamp: 2026-08-23T18:00:00+02:00
filename: log-of-a-week-of-work-on-scratch
---

Seven days, 294 commits, 391 files touched, roughly 82,000 lines added against 9,700 removed. That is not a headline feature announcement, it is a log — the kind of week where a scraping platform stops being a demo of the happy path and starts absorbing the failure modes that only show up once real targets fight back. This post walks through what actually landed on [Scratch](/projects/scratch) this week, grouped by the problem each change was solving.

## 🧠 Extraction stops being all-or-nothing

The oldest assumption in a CSS-selector scraper is that the selectors keep matching. They don't, forever. This week Scratch got a real answer to what happens when they stop.

**An LLM fallback extraction boundary** (`scratch-scraper/src/fallback.rs`) sits behind the normal selector pipeline: when selector-based extraction produces nothing usable, the worker can now hand the page to an OpenRouter-backed model, gated entirely behind environment flags so it costs nothing when unset. Extractions that are genuinely unusable — not just empty, but structurally broken — now fail into a **dedicated error category** instead of silently returning zero items, which matters because a silent empty result and a real "there was nothing to scrape" result used to look identical downstream.

That fallback path grew a second job this week: **selector repair suggestions**. When the LLM recovers data that the configured selectors missed, it doesn't just paper over the gap — it proposes a fix. A new migration (`0030_selector_repair_suggestions.sql`) and a `repair_suggestions` module on the API persist those proposals with review endpoints, so a human approves or rejects a selector change instead of the system silently rewriting scraper configuration underneath them. The scraper worker's NATS consumer forwards recovery events into the audit log, and a new review panel in `scratch-ui` surfaces the suggestions for triage. It's the difference between "the scraper broke" and "the scraper broke, and here's a diff to fix it."

Two narrower extraction bugs got fixed properly rather than worked around. RSS/Atom feeds scraped with CSS selectors were being parsed as HTML5, which meant `<title>` swallowed CDATA markers into RCDATA text and `<link>` was treated as a void element with no content — feed data was quietly corrupted. Feeds now go through an **XML-aware extraction path**. And a much larger piece landed for structured sources: **industrial JSON-API extraction for government open-data portals** — generic pagination across `page_param`, `offset_limit`, `cursor_url`, and `link_header` shapes (covering CKAN, Socrata, and OData), incremental-sync watermarks driven by `{watermark}` URL placeholders, ETag/Last-Modified conditional requests that short-circuit on 304, a terminal `partial` execution status for walks that lose pages mid-run, and instance-local per-host rate limiting with `Retry-After`-honoring retries. Open data portals behave nothing like scraped HTML, and this is the plumbing that treats them as the structured APIs they actually are, watermark tracking and all.

Rounding out the extraction surface: **bounded pagination crawling inside one execution**, so a single scraper run can walk multiple pages of a paginated source without being modeled as N separate executions, and a **extraction quality gate** merged to hold outputs to a minimum bar before they're accepted as a successful run.

## 🩺 The scraper stops lying about its own health

Two reliability fixes this week share a theme: making the system honest about what it's actually doing, rather than optimistic.

Bot-blocked scrapes used to just fail. `spider`, the crawling library the worker uses for JS rendering, launches Chromium itself against a single shared profile directory guarded by Chromium's `SingletonLock` — when a worker died mid-crawl, the browser or its lock file outlived it, and every subsequent launch aborted with "Failed to create a ProcessSingleton," silently downgrading scrapes to plain HTTP with no rendering at all. The fix (`scratch-scraper/src/browser_process.rs`, ~400 new lines) has the worker own the browser process directly: a unique temporary profile per fetch so concurrent renders never contend, explicit teardown on every exit path, and a sweep of browsers orphaned by dead workers before each new launch. `spider` still drives the browser, but over CDP against a browser Scratch controls — so a plain HTTP fetch that comes back `403`/`503` from bot protection now retries through a real, owned Chromium instead of quietly giving up.

The `/status` endpoint had a similar honesty gap: worker health was inferred purely from stuck executions, so a stopped worker with an empty queue looked perfectly healthy. Workers now **publish a heartbeat to `SCRAPE.WORKERS.HEARTBEAT` every 10 seconds over core NATS**, the API tracks per-worker last-seen state, and `GET /status` reports `active_scrape_workers` alongside the existing stale-execution signal — the pipeline is now flagged degraded when heartbeats go stale even if nothing is visibly stuck.

Dispatch latency also got a direct fix: manually triggered ("Run Now") executions were sometimes queued for minutes because the job poller's backoff stretches to five minutes during idle periods. A new migration wires a Postgres trigger to `NOTIFY` on insert into `apalis.jobs`, and the worker now runs on `PostgresStorage::new_with_notify` — the poll fetcher stays as a fallback underneath, but the common case wakes the worker instantly instead of waiting out a backoff window.

## 🔌 A platform surface for other programs, not just people

This week Scratch grew an API surface meant to be consumed by code rather than clicked through. The API now **serves a real OpenAPI 3.1 document at `/openapi.json`**, generated from the route definitions themselves (via `rovo`), with an interactive `/docs` explorer — and a follow-up merge finished the job by folding the remaining public operations into that same generated document instead of leaving gaps. On top of that spec landed a **TypeScript SDK** (`@scratch/sdk`, zero runtime dependencies) and a **Python SDK** (`scratch-sdk`, stdlib only), both built from an OpenAPI snapshot exported as part of the same change so the clients can't silently drift from the API they describe.

And, notably, an **stdio MCP server** (`scratch-mcp`) shipped this week, exposing scraping tools directly to AI agents over the Model Context Protocol — a `tools.rs`/`dispatch.rs`/`rpc.rs` split backed by a thin `api.rs` client against the existing REST surface, documented in its own usage guide. Between the OpenAPI document, the two SDKs, and the MCP server, Scratch went from "an API you read the source to integrate with" to a platform with three independent, generated-or-guided ways in.

## 💳 Product surface: billing, auth, and a UI that finally looks industrial

The commercial and account-security stories both grew up this week. **Billing now runs through Polar.sh** — checkout and webhooks wired end-to-end, with a fix to heal plan drift against Polar directly on billing-overview reads rather than trusting a possibly-stale local copy, and a fix so customers land back on `/settings?tab=plan` after checkout instead of a dead end. **TOTP-based 2FA** landed with a QR-code setup modal (`TwoFactorSetupDialog.tsx`), plus two correctness fixes that matter more than the happy path: the pending TOTP secret is now reused across repeated setup calls instead of being regenerated (which used to invalidate an authenticator app mid-setup), and a failed verify now shows the submitted code and secret fingerprint so a support conversation about "it's not working" has something concrete to look at. Session handling around auth got tightened too — a rejected credential no longer tears down an otherwise-valid session, and a rejected session now redirects to login instead of stranding the user on a dead page.

The dashboard itself went through a deliberate visual pass this week — an **Apify-style, petroleum/cyan industrial console** theme, applied consistently across the scraper form (numbered, type-colored selector rows), the execution detail page (instrument-style meta chips), the executions list (status summaries, pagination, right-aligned output), and the scrapers table (tier-colored success rate). None of it changes what the platform does, but a console that looks like an instrument panel is easier to trust at a glance than one that looks like a form.

## ✅ In short

None of this week's work is a single headline. It's the accumulation of a platform learning to fail gracefully — extraction that recovers and explains itself instead of returning silence, a worker that owns its browser instead of trusting a shared lock file, health signals that reflect what's actually running, and a public surface (OpenAPI, two SDKs, an MCP server) built for other programs to depend on. That is what a scraping platform looks like once it stops being tested against friendly pages and starts being tested against the web.
