# Unified Tag Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or **superpowers:executing-plans** to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Add static, SEO-friendly tag pages that connect blog posts, services, and projects through shared tag links.

**Architecture:** Keep content loading in src/lib/list.ts, derive a normalized tag index in src/lib/tags.ts, and render each tag through src/pages/tags/[tag].astro. Reuse existing snippets and add a focused TagLink component.

**Tech Stack:** Astro 7, TypeScript, Tailwind CSS 4, Node test runner, existing SEO helpers.

**Spec:** docs/superpowers/specs/2026-08-29-tag-navigation-design.md

## Global Constraints

- Preserve all existing routes and content.
- Tag matching is case-insensitive and trims surrounding whitespace.
- Tag slugs use lowercase Unicode text, hyphenated whitespace, reduced non-alphanumeric separators, and no redundant hyphens.
- Unknown tag slugs render Astro's 404 response.
- Tag navigation uses native links and no client-side JavaScript.
- Do not add dependencies.
- Do not add a Co-Authored-By trailer to commits.

### Task 1: Build and test the shared tag index

**Files:**
- Create: src/lib/tags.ts
- Create: test/tags.test.mjs
- Modify: src/lib/list.ts

**Interfaces:**
- slugifyTag(tag: string): string returns the canonical URL slug.
- TagEntry contains label, slug, and items grouped as articles, services, and projects.
- tagEntries is an array of all tag entries sorted by visible label.
- getTagEntry(slug: string): TagEntry | undefined resolves a normalized slug.

- [ ] Write failing tests for slugification, case-insensitive duplicates, first-label preservation, and grouping one article/service/project under one slug.
- [ ] Run node --experimental-strip-types --test test/tags.test.mjs and verify it fails because the module is absent.
- [ ] Implement the Map-backed index derived from articles, services, and projects; trim blank tags and append each item to its content group.
- [ ] Run node --experimental-strip-types --test test/tags.test.mjs and verify all index tests pass.

### Task 2: Add reusable tag links to existing views

**Files:**
- Create: src/components/TagLink.astro
- Modify: src/components/ArticleSnippet.astro
- Modify: src/components/ServiceSnippet.astro
- Modify: src/components/ProjectSnippet.astro
- Modify: src/layouts/BlogLayout.astro
- Modify: src/layouts/ServiceLayout.astro
- Modify: src/layouts/ProjectLayout.astro
- Modify: test/tags.test.mjs

**Interfaces:**
- TagLink.astro accepts tag: string and renders an anchor to /tags/[slugifyTag(tag)] with the original visible label.

- [ ] Add source-contract assertions that TagLink imports slugifyTag and all snippets/layouts render it for their tags.
- [ ] Run the focused test and verify the new assertions fail before implementation.
- [ ] Create TagLink, show article tags, and replace the existing service/project tag spans in snippets and layouts while preserving their visual treatment.
- [ ] Run the focused test and verify all tag tests pass.

### Task 3: Render static tag pages with SEO and grouped results

**Files:**
- Create: src/components/TagResults.astro
- Create: src/pages/tags/[tag].astro
- Modify: test/tags.test.mjs

**Interfaces:**
- TagResults.astro accepts title, id, items, and a kind discriminator, then renders the corresponding existing snippet.
- [tag].astro uses getStaticPaths(), getTagEntry(), and Astro.params.tag; each generated path is /tags/[entry.slug].

- [ ] Add route-contract assertions for getStaticPaths, getTagEntry, Seo, and all three result groups.
- [ ] Run the focused test and verify it fails because the route and component are absent.
- [ ] Generate one path per tag entry; render heading, optional anchor navigation, and only non-empty groups. Add canonical SEO and breadcrumbs [home, Tags, entry.label], and return Astro's 404 response for an unknown slug.
- [ ] Run the focused test and verify all route tests pass.

### Task 4: Verify the complete site

**Files:**
- Modify: test/tags.test.mjs only if a discovered route contract needs a precise regression check.

- [ ] Run pnpm test; expected result is zero failures.
- [ ] Run pnpm build; expected result is exit code 0 and generated routes for all frontmatter tags.
- [ ] Run git diff --check, git status --short, and git diff --stat; verify only approved tag-navigation files are changed.
