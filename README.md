# Spluca

Spluca is the personal website of Antonio Pardo Sánchez, a platform architect
and systems engineer. It brings together technical writing, open-source and
product engineering projects, and professional services related to cloud
infrastructure, Linux, Rust, Kubernetes, backend systems, and microVMs.

The site is available at [spluca.org](https://spluca.org) and includes:

- **Articles** about cloud architecture, Linux systems, Rust, Kubernetes,
  Firecracker, microVMs, backend engineering, and open-source platform
  development.
- **Projects** covering cloud platforms, backend services, infrastructure
  tooling, and microVM systems.
- **Services** for cloud architecture, backend development, Linux systems
  administration, Kubernetes platforms, infrastructure automation, and
  production operations.
- **Contact** information for professional enquiries.

## Technology

The site is built with [Astro](https://astro.build/), TypeScript, Markdown,
MDX, and Tailwind CSS. It is deployed to [Cloudflare Workers](https://workers.cloudflare.com/)
using Astro's Cloudflare adapter.

Content is authored as Markdown files under `src/pages/`. Astro generates the
routes and the production site at build time, while the Cloudflare adapter
packages the result as a Worker with static assets.

## Project structure

```text
├── public/                 # Static assets, fonts, and headers
├── src/
│   ├── components/         # Reusable Astro components
│   ├── layouts/            # Page layouts for the site sections
│   ├── lib/                # Content loading, metadata, SEO, and utilities
│   ├── pages/blog/         # Technical articles
│   ├── pages/projects/     # Project descriptions
│   └── pages/services/     # Service descriptions
├── test/                   # SEO and navigation tests
├── astro.config.mjs        # Astro and Cloudflare configuration
└── wrangler.jsonc          # Cloudflare Worker configuration
```

## Development

Install the dependencies and start the local development server:

```sh
pnpm install
pnpm dev
```

The development site is served at `http://localhost:4321`.

Useful commands:

| Command | Description |
| :-- | :-- |
| `pnpm test` | Run the site tests |
| `pnpm build` | Build the production site in `dist/` |
| `pnpm preview` | Build and run the site locally with Wrangler |
| `pnpm deploy` | Build and deploy the site to Cloudflare Workers |
| `pnpm astro ...` | Run an Astro CLI command |
