# SEO and organic traffic growth design

## Goal

Increase qualified international traffic and enquiries for `spluca.org` through English-language service positioning, evidence-based project content, stronger internal linking, and measurable technical SEO improvements.

## Scope

This iteration covers three tightly related workstreams:

1. Technical SEO audit and targeted fixes.
2. Evidence-based case studies for Mikrom and Scratch.
3. Conversion improvements across the service, about, and contact journeys.

The site remains English-only and keeps its existing Astro layouts and visual language. No broad redesign, automatic localization, paid advertising, or fabricated client metrics is included.

## Technical SEO

Inspect the existing source and generated HTML for:

- indexability, `robots.txt`, sitemap links, canonical URLs, and trailing-slash consistency;
- unique and intent-focused titles and descriptions;
- one clear H1 and logical heading hierarchy;
- descriptive internal link text between services, projects, and articles;
- Open Graph/Twitter metadata and service/project structured data;
- orphaned high-value pages and opportunities to link from existing content.

Only changes supported by the current project conventions and generated output will be applied. The existing page layout and performance-sensitive font/CSS behavior must remain intact.

## Case studies

Create one case-study section/page for each existing project:

- Mikrom: edge platform, isolated workloads, infrastructure and operational engineering.
- Scratch: scraping/research platform and its relevant architecture.

Each case study will use facts, technologies, and outcomes evidenced by the project pages, blog posts, or repository source. Where a quantitative result is not documented, the copy will describe the engineering result qualitatively rather than invent a number or client claim. Each case study will link to relevant services and the project repository/live page where available.

## Conversion

Improve the path from discovery to contact without changing the site's established format:

- make the value proposition and audience explicit on `/services/` and the relevant service pages;
- add contextual calls to action to contact and related evidence;
- add or improve an `/about/` page only if the current site has no suitable existing profile destination;
- keep contact copy concise, international, remote-friendly, and free of unsupported guarantees;
- ensure all new links have descriptive visible text and accessible labels where an icon is used.

## Validation

Add focused tests for new routes, metadata, structured data, and internal links. Run:

- `pnpm test`
- `XDG_CONFIG_HOME=/tmp/spluca-xdg pnpm build`
- `git diff --check`

Inspect the generated HTML for the new pages and confirm that the sitemap includes them. External Search Console submission and Cloudflare configuration remain manual account-level steps.

## Delivery

Implementation will be split into small commits if the work naturally separates. No commit will include unrelated working-tree changes, and no `Co-Authored-By` trailer will be added.
