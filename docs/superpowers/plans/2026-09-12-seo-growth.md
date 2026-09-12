# SEO and organic traffic growth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve qualified international traffic and enquiries through evidence-based service content, project case studies, internal linking, and validated technical SEO.

**Architecture:** Keep the existing Astro static-content model and `ServiceLayout`/`ProjectLayout` visual system. Add case-study content as project-page sections or dedicated content pages only where the current routing supports it; centralize repeated metadata and CTA copy in existing SEO/layout helpers rather than introducing a second content system.

**Tech Stack:** Astro 7, Markdown content, TypeScript, Node test runner, pnpm, Cloudflare static adapter.

**Spec:** `docs/superpowers/specs/2026-09-12-seo-growth-design.md`

## Global Constraints

- The site remains English-only and keeps its existing Astro layouts and visual language.
- Use only facts, technologies, and outcomes evidenced by the repository; do not invent quantitative results or client claims.
- No broad redesign, automatic localization, paid advertising, or fabricated client metrics.
- Preserve the existing performance-sensitive font/CSS behavior and service-page format.
- All new links must have descriptive visible text and accessible labels where an icon is used.
- Do not include unrelated working-tree changes or a `Co-Authored-By` trailer in commits.

### Task 1: Audit and strengthen technical SEO

**Files:**
- Inspect: `src/components/Seo.astro`, `src/lib/seo.ts`, `src/pages/index.astro`, `src/pages/services/index.astro`, `src/pages/projects/index.astro`, `src/pages/blog/index.astro`, `public/robots.txt`
- Modify: only files where the audit identifies a concrete gap
- Test: `test/seo.test.mjs`

**Interfaces:**
- Consumes the existing `Seo` component, `GLOBAL` metadata, and static routes.
- Produces unique metadata, valid canonical URLs, descriptive internal links, and tests that guard the changed behavior.

- [ ] **Step 1: Add failing assertions for the audit findings**

  Extend `test/seo.test.mjs` to read the affected source or generated fixture and assert the exact required behavior: every changed page has one intended H1, a unique title/description, a canonical path, and descriptive links to its related service/project/contact destination.

- [ ] **Step 2: Run the focused test and verify the assertions fail for the missing behavior**

  Run `pnpm test`. Confirm the new assertion fails because the audited metadata or link is not present, rather than because of a test syntax or import error.

- [ ] **Step 3: Apply the smallest technical SEO fixes**

  Reuse `absoluteUrl`, existing schema helpers, and current Astro layouts. Update only metadata, links, schema, or robots/sitemap behavior supported by the repository evidence. Keep URL normalization consistent with the existing no-trailing-slash canonical convention.

- [ ] **Step 4: Run the focused and complete tests**

  Run `pnpm test`. Confirm all suites pass and no existing service/project layout test regresses.

- [ ] **Step 5: Commit the technical SEO changes**

  Run `git add` with only the audited files and `git commit -m "feat: strengthen technical SEO signals"`.

### Task 2: Publish evidence-based project case studies

**Files:**
- Inspect: `src/pages/projects/mikrom.md`, `src/pages/projects/scratch.md`, related `src/pages/blog/*.md`, and project metadata helpers
- Modify: `src/pages/projects/mikrom.md`, `src/pages/projects/scratch.md`, `test/seo.test.mjs`

**Interfaces:**
- Consumes existing project frontmatter and `ProjectLayout` rendering.
- Produces two English case-study sections with descriptive links to related services and project resources.

- [ ] **Step 1: Add failing case-study content assertions**

  Add tests that read both project pages and assert the presence of the exact case-study headings and links to `/services/`, `/blog/`, or the existing repository/live URLs used by each page.

- [ ] **Step 2: Run the test and verify it fails**

  Run `pnpm test`. Confirm it fails because the case-study headings or contextual links do not yet exist.

- [ ] **Step 3: Add the Mikrom case study**

  Extend `src/pages/projects/mikrom.md` with sections for the problem/context, engineering approach, and current result. Use only facts already present in the project page, related blog posts, or source. Link phrases such as `Kubernetes platform engineering` and `Rust and Go backend development` to the matching service pages.

- [ ] **Step 4: Add the Scratch case study**

  Extend `src/pages/projects/scratch.md` with the same structure, using only repository evidence. Link the relevant service and article pages with visible descriptive text; do not claim customer metrics or production outcomes that are not documented.

- [ ] **Step 5: Run tests and inspect generated HTML**

  Run `pnpm test` and `XDG_CONFIG_HOME=/tmp/spluca-xdg pnpm build`. Inspect the generated project HTML for the headings, links, canonical metadata, and structured data.

- [ ] **Step 6: Commit the case studies**

  Run `git add src/pages/projects/mikrom.md src/pages/projects/scratch.md test/seo.test.mjs` and `git commit -m "feat: add project case studies"`.

### Task 3: Improve the discovery-to-contact path

**Files:**
- Inspect: `src/pages/contact.astro`, `src/pages/services/index.astro`, `src/layouts/ServiceLayout.astro`, `src/pages/index.astro`
- Modify: the smallest set of inspected files required for contextual CTAs and profile positioning
- Test: `test/seo.test.mjs`

**Interfaces:**
- Consumes the existing service/contact layouts and `GLOBAL` metadata.
- Produces explicit international positioning, contextual contact links, and accessible descriptive link text without changing the visual layout system.

- [ ] **Step 1: Add failing conversion-path assertions**

  Add tests that assert the services and project pages expose a descriptive contact CTA, that the profile/about destination is discoverable if present, and that icon-only contact/social links retain accessible labels.

- [ ] **Step 2: Run the tests and verify the new assertions fail**

  Run `pnpm test` and confirm the failure identifies the absent CTA/profile path.

- [ ] **Step 3: Implement concise English conversion copy**

  Add or improve the profile destination only if no suitable page exists. Add contextual `Contact me about...` links to services and case studies, preserving existing classes and spacing. Keep promises factual and the form/contact path concise for remote international teams.

- [ ] **Step 4: Run tests and build**

  Run `pnpm test`, `XDG_CONFIG_HOME=/tmp/spluca-xdg pnpm build`, and `git diff --check`. Inspect generated HTML to ensure service formatting remains unchanged and all new links have descriptive text.

- [ ] **Step 5: Commit the conversion changes**

  Run `git add` with only the conversion files and tests, then `git commit -m "feat: improve service conversion paths"`.

### Task 4: Final crawl and delivery verification

**Files:**
- Inspect: `dist/client`, `public/robots.txt`, generated sitemap files, and `git status`

- [ ] **Step 1: Run the complete verification suite**

  Run `pnpm test`, `XDG_CONFIG_HOME=/tmp/spluca-xdg pnpm build`, and `git diff --check`.

- [ ] **Step 2: Verify crawlable output**

  Confirm the sitemap contains the new/updated canonical URLs, generated pages contain one H1 and expected metadata, internal links resolve to existing routes, and no new stylesheet/font behavior appears.

- [ ] **Step 3: Review repository state**

  Run `git status --short` and `git log --oneline -4`. Confirm only intentional commits and no untracked build artifacts remain.

- [ ] **Step 4: Report external follow-up**

  Document the manual steps still required in Search Console: submit/refresh the sitemap, inspect the important URLs, and monitor impressions, queries, CTR, and countries. Cloudflare compression remains an account-level setting outside this repository.
