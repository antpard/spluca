---
layout: ../../layouts/ProjectLayout.astro
title: Scratch
description: Web-scraping operations platform with a Next.js dashboard, Rust services, AI-assisted extraction, and an opt-in residential proxy network.
tags: ["Rust", "Next.js", "Web Scraping", "MCP", "PostgreSQL"]
githubUrl: https://github.com/spluca/scratch
liveUrl: https://scratch.spluca.org/
featured: true
timestamp: "2026-08-29"
filename: scratch
---

Scratch is an open-source web-scraping operations platform for defining, running, monitoring, and exporting structured data extraction jobs. It combines a Next.js operations dashboard with a Rust/Axum API, a NATS JetStream worker, and an opt-in residential proxy network. The same platform is available through the web UI, REST API, typed SDKs, and an MCP server for AI agents.

## What the repository includes

- `scratch-ui`: Next.js and React dashboard for scraper CRUD, execution monitoring, SSE updates, settings, billing, webhooks, and platform status.
- `scratch-api`: Rust/Axum control plane for authentication, organizations, scrapers, executions, schedules, exports, notifications, billing, webhooks, metrics, and OpenAPI.
- `scratch-scraper`: NATS JetStream worker for HTTP fetching, headless Chromium rendering, browser actions, crawling, JSON APIs, and extraction fallback.
- `scratch-residential`: Rust node and gateway for an opt-in residential proxy network, with HTTP CONNECT, WebSocket tunnels, native TLS, country routing, sticky sessions, and load balancing.
- `scratch-mcp`: stdio MCP server exposing authenticated scraping tools to AI agents.
- `sdk/typescript` and `sdk/python`: zero-dependency clients for scraper management, execution polling, item exports, and selector-repair review.
- `scratch-landing`: Astro marketing site with English and Spanish company pages, pricing, security/legal content, contact handling, and a platform overview.
- `ci`: Rust Dagger runner for API, scraper, proxy, frontend, Chromium, Playwright, formatting, packaging, and release validation.

## How a scrape moves through the platform

1. A user creates a scraper from the dashboard, SDK, API, or MCP server.
2. `scratch-api` validates the target, selectors, schedule, organization scope, and optional proxy configuration, then queues an execution through the PostgreSQL-backed Apalis outbox.
3. NATS JetStream delivers the scrape request to `scratch-scraper`.
4. The worker fetches the page directly or through the residential proxy, optionally launches Chromium, performs browser actions and bounded pagination, and extracts structured rows.
5. Native CSS, XPath, regex, or JSONPath extraction is checked by a quality gate; configured LLM fallback can recover unusable results through OpenRouter.
6. The API persists executions and items, streams lifecycle events over SSE, and can trigger signed webhooks, notifications, change detection, exports, or selector-repair suggestions.

This separation keeps the API responsible for durable state and orchestration while the worker owns the expensive, failure-prone scraping runtime.

## Scraping capabilities

Scratch supports CSS, XPath, regex, and RFC 9535 JSONPath selectors; positional row assembly; JavaScript rendering through Chromium; pre-extraction click/fill/wait/scroll/evaluate actions; bounded crawling with cycle guards; scheduled runs with time zones and cron; JSON-API pagination; incremental watermarks; ETag/Last-Modified handling; RSS/Atom and open-data sources; and CSV, JSON, NDJSON, and Markdown exports. SSRF protection resolves targets to public addresses before connecting, while per-host limits, timeouts, retries, and extraction quality classification keep failed or empty runs visible.

The Selector Assistant can infer selectors, repair broken configurations, and propose validated changes for owner review. Auto-extract mode lets the configured LLM infer repeating records without hand-written selectors, while the fallback remains opt-in.

## Platform features

The API provides email/password authentication, SVG captcha, TOTP two-factor authentication, JWT revocation, avatars, API keys with scopes, organization switching, owner/member roles, invitations, audit events, notifications, and tenant isolation enforced with PostgreSQL foreign keys. Polar handles hosted checkout, plan transitions, customer portal sessions, and organization-level quotas. Per-scraper HMAC-SHA256 webhooks cover completed, failed, changed, and stale executions with retries and test delivery.

The public API is described by an OpenAPI 3.1 document at `/openapi.json` with an interactive explorer at `/docs`. `scratch-mcp` exposes the core scraper and execution workflows over JSON-RPC 2.0, allowing agents to operate the platform with scoped API keys. Prometheus metrics, a public `/status` endpoint, worker heartbeats, and the dashboard status page provide operational visibility.

## Residential proxy network

The proxy subsystem is designed for explicit opt-in participation: a node runs on a contributor's device and connects to the gateway over an authenticated WebSocket tunnel. Scraper traffic can use an HTTP CONNECT gateway, with optional native TLS termination for `wss://`, country-code targeting, ten-minute sticky sessions, and least-in-flight fallback. TLS remains end to end between the worker and the destination.

## Current stack and validation

- Rust 2024 with Tokio, Axum, SQLx, async-nats, Apalis, tracing, and serde.
- Next.js 16, React 19, TypeScript, Tailwind CSS 4, Skeleton, Vitest, Playwright, and OpenNext for the dashboard.
- Astro, React, Tailwind CSS 4, and Cloudflare Workers for the landing site.
- PostgreSQL 18 for local development, NATS JetStream for scrape dispatch, Chromium for browser rendering, and OpenRouter as an optional LLM provider.
- Dagger-backed `make ci-*` profiles for isolated API/scraper/proxy tests, frontend checks, Chromium validation, Debian packages, and end-to-end Playwright coverage.
- Makefile-driven local services (`make db-up`, `make ui-dev`, `make api-dev`, `make scraper-dev`) and separate deployment targets for the Cloudflare frontend and landing Workers. The API and Rust workers are packaged for Debian and managed as platform services.

## Recent direction

The recent Git history shows Scratch evolving from a scraper dashboard into a broader data-operations platform: the scraper gained crawling, browser actions, JSON/open-data sources, auto-extraction, Markdown exports, quality gates, selector repair, scheduling, change detection, and notifications; the residential gateway gained native TLS, geo-targeting, and sticky sessions; and the API gained organizations, invitations, roles, audit logs, billing, OpenAPI, SDKs, and MCP access. The latest work also completed the Skeleton/Crimson dashboard migration and added bilingual landing pages with a Cloudflare contact form.

Scratch is therefore both a practical operator UI and a composable data platform: it covers the path from scraper definition to validated extracted data, while keeping automation, proxying, observability, billing, and AI-assisted recovery visible in the repository.
