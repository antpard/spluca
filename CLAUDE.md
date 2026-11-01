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

**Astro 5 + Tailwind CSS 4 + MDX**, deployed as a Cloudflare Worker via `@astrojs/cloudflare`. The site is served at `spluca.org` (the canonical host); `www.spluca.org` and `apardo.spluca.org` both 301-redirect to it.

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

`wrangler.jsonc` configures the Cloudflare Worker. The site uses Smart Placement and has observability (logs + traces) enabled. Routes cover `spluca.org`, `www.spluca.org`, and `apardo.spluca.org` — all three stay as custom domains so the DNS records exist, but only `spluca.org` reaches the Worker. `www.spluca.org` and `apardo.spluca.org` are 301-redirected to `spluca.org` by zone-level Cloudflare Redirect Rules (`www-to-root-domain`, `apardo-domain-to-root`), which run before Workers and are configured in the Cloudflare dashboard, not in this repo.

### Assets & performance

- Fonts are self-hosted (`public/fonts/*.woff2`, `@font-face` in `src/styles/global.css`); the primary weights are preloaded in `Layout.astro`. No third-party font CDNs.
- Content images that need optimization go through `astro:assets` `<Image>` with a source under `src/assets/` (see `Hero.astro`). `sharp` runs at build time. Raw files in `public/` are served as-is.
- `public/_headers` sets `Cache-Control` for fonts, images, and feeds; the Cloudflare adapter injects the immutable rule for `/_astro/*`.
