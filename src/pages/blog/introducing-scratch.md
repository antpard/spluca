---
layout: ../../layouts/BlogLayout.astro
title: "Introducing Scratch: A Web-Scraping Operations Platform"
description: "Scratch is a web-scraping operations platform with a Next.js dashboard, a Rust/Axum API, and an opt-in residential proxy network — built to turn raw web data into clean, aggregated datasets for sale across verticals."
tags: ["Rust", "Axum", "Next.js", "PostgreSQL", "Dagger", "data"]
time: 6
featured: true
timestamp: 2026-08-16T10:00:00+02:00
filename: introducing-scratch
---

Most scraping projects start the same way: a script, a cron job, and a spreadsheet nobody trusts after the third schema change. **Scratch** is an attempt to build the thing that usually gets skipped — the operations layer around scraping, so that extracting data at scale is a platform capability instead of a pile of one-off scripts.

## What Scratch is

Scratch is a small, opinionated system with four moving parts, [source available on GitHub](https://github.com/spluca/scratch):

- **`scratch-ui`** — a Next.js dashboard for monitoring scrapers and their executions: which jobs are running, which ones failed, and what they produced.
- **`scratch-api`** — a Rust/Axum service backed by PostgreSQL that exposes the application's endpoints and owns the scraper and execution state.
- **`scratch-residential`** — a Rust node and gateway for an *opt-in* residential proxy network, so scraping traffic doesn't have to funnel through a handful of easily-blocked datacenter IPs.
- **A Dagger-based CI runner** that validates the API, the frontend, and end-to-end Playwright flows the same way in a laptop and in CI, since the pipeline runs the exact containers Dagger builds rather than a YAML approximation of them.

The stack choices are deliberate rather than incidental. Rust/Axum gives the API predictable performance and memory behavior under the bursty, I/O-heavy load that scraping produces — lots of concurrent requests, lots of waiting on the network, none of which should require a garbage collector to reason about. PostgreSQL holds execution history and scraper state as structured, queryable data rather than logs scattered across machines. The health endpoint reflects that directly: `/health` returns `200 OK` with `{"status":"ok"}` when the database is reachable and a proper `503` with `{"status":"unavailable"}` when it isn't — a small detail, but one that makes the platform legible to anything orchestrating it, from a human on-call to a supervisor process deciding whether to restart a node.

Day-to-day development is Makefile-driven — `make api-dev`, `make ui-dev`, `make db-up` — with a matching set of `make ci*` targets that run the same Dagger stages CI does. That symmetry matters: a scraping platform lives or dies on whether failures are visible before they hit production, and getting identical validation locally and in CI removes an entire class of "works on my machine" incidents.

## Why: clean data, not just scraped data

Scraping is not the hard part. Every serious data team has, at some point, written a script that pulls HTML off a page. The hard part — the part that actually has value — is turning that raw, inconsistent, constantly-drifting HTML into structured, deduplicated, schema-stable data that a downstream system can trust without a human checking it first.

That's the actual product Scratch is built toward: **clean, aggregated data as a sellable asset**, not scraping-as-a-service. The platform's job is to make extraction observable and repeatable — visible execution history, a dashboard that shows what ran and what it produced, structured storage instead of ad hoc files — so that what comes out the other side is something a buyer in e-commerce, finance, real estate, logistics, or market research can actually integrate: normalized schemas, deduplicated records, monitored freshness, and a paper trail on where a data point came from.

The opt-in residential proxy network exists in service of that goal, not as a separate feature. Aggregated, cross-sector data is only valuable if it's collected reliably and ethically, and datacenter IPs get rate-limited or blocked precisely on the high-value, high-scale targets that make a dataset worth aggregating in the first place. Routing through a residential network — built on explicit opt-in rather than any form of covert traffic hijacking — is what keeps extraction stable enough to produce data with the freshness and completeness a paying buyer needs.

## Get involved

Scratch is early, and the parts that make it interesting to a systems or data engineer are exactly the parts that benefit from more eyes: the Axum API's execution model, the PostgreSQL schema for scraper and job state, the Dagger CI pipeline, and the residential proxy's node/gateway protocol.

If you work with Rust, Next.js, PostgreSQL, or scraping infrastructure and any of this sounds like your kind of problem, clone the repo, run `make install && make db-up && make api-dev && make ui-dev`, and see what breaks. Issues, pull requests, and design discussions are welcome on the [GitHub repository](https://github.com/spluca/scratch) — and if you'd rather talk it through first, reach me at [hola@spluca.org](mailto:hola@spluca.org).
