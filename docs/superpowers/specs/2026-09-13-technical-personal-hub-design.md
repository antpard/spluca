# Technical Personal Hub UI/UX Design

## Status

Approved design for review before implementation.

## Objective

Improve Spluca's UI/UX for a mixed audience, with priority for CTOs and founders, while preserving its technical and editorial identity.

The site should communicate three things quickly and in balance:

1. What Antonio can help with.
2. What he has built.
3. How he thinks about complex systems.

The first implementation delivery covers the header, home page, content indexes and detail-page continuity, plus responsive and accessibility polish.

## Design direction

Use a "technical personal hub" direction. Preserve the current monospaced typography, strong contrast, dark/light themes, underlined links, restrained red accent, and static Astro architecture. Improve hierarchy, content scannability, calls to action, and navigation without turning the site into a generic corporate landing page.

Avoid adding a component library, a CMS, a search system, advanced filters, complex animation, or a new content model in this delivery.

## Information architecture

The primary journey is:

```text
Home -> Services -> Contact
Home -> Projects -> Article or repository
Article -> Related project or Contact
Project -> Related services
Service -> Contact
```

The home page order is:

1. Hero and primary actions.
2. Services: how Antonio can help.
3. Selected projects: evidence of experience.
4. Latest articles: technical depth and editorial perspective.
5. Final contact call to action.

## Header design

Add a persistent identity anchor at the left of the desktop header, such as `SPLUCA` or `Antonio Pardo`.

The desktop navigation should visually distinguish the primary contact action from secondary navigation and profile/theme/RSS controls:

```text
SPLUCA        About  Projects  Services  Blog        Contact  Theme  Profiles
```

Required behavior:

- Mark the current route with `aria-current="page"` and a visible active state.
- Make `Contact` the primary header CTA.
- Keep RSS, theme, GitHub, and LinkedIn as secondary actions.
- Add `aria-expanded` and `aria-controls` to the mobile menu button.
- Use a menu/close icon state.
- Close the menu after selecting a route.
- Support keyboard navigation and visible focus states.
- Respect reduced-motion preferences.

## Home hero

The hero should communicate identity, value, audience, and next actions without requiring scrolling.

Proposed content hierarchy:

```text
PLATFORM ARCHITECT · SYSTEMS ENGINEER

I build reliable platforms for teams shipping hard software.

Cloud infrastructure, backend systems, Linux, Kubernetes,
and microVMs — from architecture to production.

[Discuss your system]  [Explore projects]

25 years experience · Remote international work · Cloud to production
```

Keep the profile image, but give the value proposition and actions more visual priority. The final English copy should remain consistent with the current site content.

## Home sections

Each section should have a title, a short introduction, a constrained preview, and a contextual link.

### Services

Present the service categories as compact, scannable blocks or rows. Emphasize the problems solved and link to the full services page.

### Selected projects

Give one project clear prominence and show only a small number of additional references. Keep tags secondary. Use descriptive link labels for repository and live links.

### Latest articles

Use an editorial list with a featured article, date, reading time, and compact supporting entries. Tags remain useful on indexes but should not dominate the home page.

### Final CTA

End the home page with a direct invitation to discuss a system or project.

## Content index and detail pages

### Services

Reorder the services index so it follows this sequence:

1. Clear value proposition.
2. Primary contact CTA.
3. Services and the problems they solve.
4. How the engagement works: understand, define, implement/validate, document/handoff.
5. Existing FAQ content.
6. Final contact CTA.

Each service should make its audience, problem, deliverables, and starting point clear.

### Projects

Use a featured project followed by a compact list. Detail pages should make this structure visible:

```text
What it is
What problem it solves
My work
Technical scope
Repository or live product
```

### Articles

Give the blog index a featured article and clear editorial metadata. Detail pages should expose category/tags, reading time, publication date, previous/next navigation, related content, and a final contact CTA where appropriate.

### Cross-linking

Every important page must offer a meaningful next step. Cross-links should connect services, projects, articles, and contact naturally without duplicating large blocks of copy.

## Visual system

Define reusable rules rather than introducing decorative cards everywhere:

- Reserve the pixel/display font for short labels and headings that fit comfortably.
- Use IBM Plex Mono for long and wrapped titles.
- Establish a fixed hierarchy for title, subtitle, body, and metadata.
- Use one primary CTA style and one contextual-link style.
- Use shared separators for lists and consistent vertical rhythm.
- Use the red accent for actions, active links, and purposeful emphasis.
- Preserve the austere background and both color themes.
- Allow the home/header content width to be slightly wider than the long-form reading width.

## Responsive behavior

On mobile:

- Stack the hero and make the actions easy to tap.
- Keep project/service rows readable without horizontal overflow.
- Reflow article metadata to avoid collisions.
- Control wrapping for long titles.
- Use a clear expanded navigation state.

On desktop:

- Balance hero copy and profile image.
- Give sections distinct visual density.
- Keep long-form text at a comfortable reading width.

Touch targets should be at least 44px where practical.

## Accessibility and performance

- Ensure all controls and social icons have accessible names.
- Keep keyboard focus visible.
- Do not communicate state through color alone.
- Check contrast in light and dark themes.
- Keep JavaScript limited to menu and theme behavior.
- Preserve explicit image dimensions and optimized hero loading.
- Keep the static Astro rendering model.
- Preserve reduced-motion support.

## Expected files

Likely implementation files:

- `src/components/Header.astro`
- `src/components/home/Hero.astro`
- `src/pages/index.astro`
- `src/components/home/FeaturedProjects.astro`
- `src/components/home/FeaturedServices.astro`
- `src/components/home/FeaturedArticles.astro`
- `src/components/common/Section.astro`
- `src/components/ServiceSnippet.astro`
- `src/components/ProjectSnippet.astro`
- `src/components/ArticleSnippet.astro`
- `src/layouts/BlogLayout.astro`
- `src/layouts/ProjectLayout.astro`
- `src/layouts/ServiceLayout.astro`
- `src/pages/services/index.astro`
- `src/pages/projects/index.astro`
- `src/pages/blog/index.astro`
- `src/styles/global.css`
- `src/lib/variables.ts`

The exact file set should be reduced during implementation if an existing component can express the design without unnecessary abstraction.

## Acceptance criteria

- A first-time visitor understands what Antonio does and who he helps without scrolling.
- The home page provides clear actions for contacting Antonio and exploring projects.
- Services, projects, and articles have distinct visual and informational roles.
- Important pages offer a natural next step.
- The mobile menu is accessible and behaves predictably.
- Long titles remain readable in both themes and at mobile widths.
- Keyboard navigation and focus states work across the primary journey.
- Existing content and Markdown-based data remain compatible.
- No heavy client-side dependency or complex animation is introduced.

## Verification

After implementation, run:

- `pnpm test`
- `pnpm build`
- visual checks for `/`, `/services/`, `/projects/`, `/blog/`, `/contact/`, and one detail page of each content type;
- keyboard navigation checks;
- light/dark theme checks;
- mobile and desktop layout checks.

The current environment may require a writable `XDG_CONFIG_HOME` for Wrangler/Astro commands. Environment failures must be reported separately from product or UI failures.
