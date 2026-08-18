---
layout: ../../layouts/ProjectLayout.astro
title: Scratch
description: Web-scraping operations platform with a Next.js dashboard, a Rust/Axum API, and an opt-in residential proxy network.
tags: ["Rust", "Next.js", "Axum", "PostgreSQL", "Dagger"]
githubUrl: https://github.com/spluca/scratch
liveUrl: https://scraping.spluca.org/
featured: true
timestamp: "2026-08-13"
filename: scratch
---

Scratch is a web-scraping operations platform built around a Next.js dashboard for monitoring scrapers and their executions, backed by a Rust/Axum API and a PostgreSQL database. The repository also includes `scratch-residential`, a Rust node and gateway for an opt-in residential proxy network, and a Dagger-backed CI runner that validates the API, the frontend, and end-to-end Playwright tests. Like Mikrom, it follows a Makefile-driven workflow for local development (`make app-dev`, `make api-dev`, `make db-up`) and a set of `make ci*` targets for reproducible validation through Dagger.
