# Technical Personal Hub UI/UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved Technical Personal Hub design so Spluca clearly balances services, technical work, and editorial content for a mixed audience, prioritizing CTOs and founders.

**Architecture:** Preserve the static Astro content model, Markdown routes, shared layouts, and theme system. Improve hierarchy with existing components plus small shared CTA/navigation styles. Do not add a UI library, CMS, client-side data layer, new content model, search, advanced filters, or complex animation.

**Tech Stack:** Astro 7, Tailwind CSS 4, TypeScript-checked Astro components, Markdown, Node test runner, Cloudflare static adapter.

**Spec:** `docs/superpowers/specs/2026-09-13-technical-personal-hub-design.md`

## Global Constraints

- Preserve monospaced typography, strong contrast, dark/light themes, underlined links, restrained red accent, and static Astro rendering.
- Keep JavaScript limited to menu and theme behavior.
- Preserve explicit image dimensions and optimized hero loading.
- Keep existing Markdown data and routes compatible.
- Respect reduced motion, visible keyboard focus, and practical 44px touch targets.

## File map

- `src/components/Header.astro`: identity, active route, contact CTA, accessible mobile menu.
- `src/components/home/Hero.astro`: value proposition, proof line, hero actions.
- `src/pages/index.astro`: home hierarchy and final CTA.
- `src/components/home/Featured{Services,Projects,Articles}.astro`: distinct home previews.
- `src/components/{Service,Project,Article}Snippet.astro`: compact content rows and metadata.
- `src/layouts/{Blog,Project,Service}Layout.astro`: detail headers, next steps, and CTAs.
- `src/pages/{services,projects,blog}/index.astro`: decision-oriented indexes.
- `src/components/common/Section.astro`, `src/styles/global.css`, `src/lib/variables.ts`: shared layout, styles, and copy.
- `test/performance-accessibility.test.mjs`, `test/seo.test.mjs`: source-level regressions.

### Task 1: Shared primitives and copy

**Files:** Modify `src/lib/variables.ts`, `src/components/common/Section.astro`, `src/styles/global.css`, and `test/performance-accessibility.test.mjs`.

- [ ] Add failing assertions for the primary CTA class, hero/contact copy, and shared navigation contracts.
- [ ] Run `pnpm test -- test/performance-accessibility.test.mjs`; verify only the new assertions fail.
- [ ] Add centralized labels for the hero eyebrow, value proposition, proof line, and CTA destinations.
- [ ] Add shared classes for primary CTA, secondary CTA, active navigation, separators, focus, and responsive section width. Preserve existing theme tokens and reduced-motion rules.
- [ ] Run `pnpm test -- test/performance-accessibility.test.mjs`; expect zero failures.
- [ ] Commit with `git add src/lib/variables.ts src/components/common/Section.astro src/styles/global.css test/performance-accessibility.test.mjs && git commit -m "feat: add shared personal hub ui primitives"`.

### Task 2: Header and hero conversion path

**Files:** Modify `src/components/Header.astro`, `src/components/home/Hero.astro`, `src/pages/index.astro`, `test/performance-accessibility.test.mjs`, and `test/seo.test.mjs`.

- [ ] Add failing assertions for a persistent identity link, `aria-expanded`, `aria-controls`, `aria-current`, `/contact`, `/projects`, and the approved home section order.
- [ ] Run `pnpm test -- test/performance-accessibility.test.mjs test/seo.test.mjs`; verify the new assertions fail.
- [ ] Implement identity, route-aware links, contact CTA, mobile menu IDs, menu/close state, `aria-expanded`, close-after-navigation, desktop reset, keyboard focus, and preserved secondary controls.
- [ ] Implement the hero eyebrow, value proposition, supporting description, proof line, contact action, project action, and optimized profile image. Use display font only for short legible labels.
- [ ] Run the two focused test files; expect zero failures.
- [ ] Commit with `git add src/components/Header.astro src/components/home/Hero.astro src/pages/index.astro test/performance-accessibility.test.mjs test/seo.test.mjs && git commit -m "feat: improve home conversion path and navigation"`.

### Task 3: Distinct home sections

**Files:** Modify `src/pages/index.astro`, the three `src/components/home/Featured*.astro` files, the three snippet components, and `test/seo.test.mjs`.

- [ ] Add failing assertions for Services → Projects → Articles order, final contact CTA, descriptive project links, article metadata, and the five-item article limit.
- [ ] Run `pnpm test -- test/seo.test.mjs`; verify the new assertions fail.
- [ ] Add concise introductions and compact service rows while keeping existing props, tags, and `/services` destination.
- [ ] Give the first featured project prominence, keep supporting projects compact, and label external destinations descriptively without changing routes/frontmatter.
- [ ] Present the newest article as the lead item and supporting entries with date, duration, and tags; keep `/blog` and the five-item limit.
- [ ] Add the final home invitation to discuss a system and run the focused SEO tests; expect zero failures.
- [ ] Commit with `git add src/pages/index.astro src/components/home/FeaturedServices.astro src/components/home/FeaturedProjects.astro src/components/home/FeaturedArticles.astro src/components/ServiceSnippet.astro src/components/ProjectSnippet.astro src/components/ArticleSnippet.astro test/seo.test.mjs && git commit -m "feat: clarify home content hierarchy"`.

### Task 4: Service, project, and article journeys

**Files:** Modify the three content index pages, the three Markdown layouts, and `test/seo.test.mjs`.

- [ ] Add failing assertions for early/final service contact CTAs, selected-project and featured-article markers, and a meaningful next step in each detail layout.
- [ ] Run `pnpm test -- test/seo.test.mjs`; verify the new assertions fail.
- [ ] Reorder services as value proposition → CTA → services/problems → four-step engagement flow → FAQ → final CTA.
- [ ] Feature the first project, retain the full list, and make detail headers communicate what it is, scope, links, and contact next step.
- [ ] Feature the newest article, retain the full list and SEO metadata, add a supported return/related navigation path, and add a non-disruptive contact CTA.
- [ ] Run `pnpm test -- test/seo.test.mjs`; expect zero failures.
- [ ] Commit with `git add src/pages/services/index.astro src/pages/projects/index.astro src/pages/blog/index.astro src/layouts/ServiceLayout.astro src/layouts/ProjectLayout.astro src/layouts/BlogLayout.astro test/seo.test.mjs && git commit -m "feat: connect content pages to contact journeys"`.

### Task 5: Responsive, accessibility, and production verification

**Files:** Modify tests only if a narrowly scoped missing regression assertion is discovered.

- [ ] Run `pnpm test`; expect all tests to pass.
- [ ] Run `XDG_CONFIG_HOME=/tmp/spluca-xdg pnpm run build`; record any Cloudflare `uv_interface_addresses` environment failure separately from Astro content/build output.
- [ ] Review `/`, `/services/`, `/projects/`, `/blog/`, `/contact/`, one detail route of each type, and both themes at mobile and desktop widths. Check no overflow, readable titles, section hierarchy, focus, menu behavior, and touch targets.
- [ ] Use keyboard only to open/close navigation, visit primary routes, and activate both hero CTAs.
- [ ] Run `git diff --check`, `git status --short --branch`, and `git log --oneline --decorate -6`; ensure only intended implementation changes and commits remain.
- [ ] If required, commit only test regressions with `git add test/performance-accessibility.test.mjs test/seo.test.mjs && git commit -m "test: cover personal hub ui regressions"`.
