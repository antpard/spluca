# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev       # Dev server on :4321
pnpm build     # Production build
pnpm deploy    # Build + deploy to Cloudflare Workers (astro build && wrangler deploy)
pnpm preview   # Build + run locally with wrangler dev
```

## Architecture

**Astro 5 + Tailwind CSS 4 + MDX**, deployed as a Cloudflare Worker via `@astrojs/cloudflare`. The site is served at `apardo.spluca.org` / `spluca.org`.

### Content model

Content lives as `.md` files with frontmatter under `src/pages/blog/` and `src/pages/projects/`. Each file must declare a `layout` pointing to the corresponding layout in `src/layouts/`.

Required frontmatter fields:
- **Blog** (`BlogLayout.astro`): `title`, `description`, `tags`, `time` (minutes), `featured` (bool), `timestamp` (W3C), `filename` (slug, no extension)
- **Projects** (`ProjectLayout.astro`): `title`, `description`, `tags`, `liveUrl`, `githubUrl`, `featured` (bool), `timestamp` (W3C), `filename` (slug, no extension)

### Content loading (`src/lib/`)

- `utils.ts` — `processContentInDir()` reads `.md` files from a content directory at build time using `import.meta.glob`. Only `.md` files are picked up (not `.mdx`).
- `list.ts` — exports `articles` and `projects` arrays (all content, sorted by `timestamp` desc).
- `featured.ts` — exports `featuredArticles` and `featuredProjects` (filtered by `featured: true`), used on the homepage.
- `variables.ts` — `GLOBAL` object with site metadata, social links, and display strings. Edit here to change site-wide text.
- `types.ts` — `ArticleFrontmatter` and `ProjectFrontmatter` TypeScript types.

### Deployment

`wrangler.jsonc` configures the Cloudflare Worker. The site uses Smart Placement and has observability (logs + traces) enabled. Routes cover `spluca.org`, `www.spluca.org`, and `apardo.spluca.org`.

Sentry is integrated via `@sentry/astro` for error tracking in production.
