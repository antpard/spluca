import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("RSS icon link has a descriptive accessible name", async () => {
  const header = await readFile("src/components/Header.astro", "utf8");

  assert.match(
    header,
    /<Anchor url="https:\/\/spluca\.org\/rss\.xml" aria-label="RSS Feed">/,
  );
});

test("secondary display font is not preloaded on the critical path", async () => {
  const layout = await readFile("src/layouts/Layout.astro", "utf8");

  assert.doesNotMatch(layout, /href="\/fonts\/press-start-2p-latin-400-normal\.woff2"/);
});

test("secondary fonts do not swap in after first paint", async () => {
  const styles = await readFile("src/styles/global.css", "utf8");

  assert.match(styles, /font-weight: 500;[\s\S]*?font-display: optional/);
  assert.match(styles, /font-weight: 600;[\s\S]*?font-display: optional/);
  assert.match(styles, /font-family: "press-start-2p";[\s\S]*?font-display: optional/);
});

test("mobile navigation starts hidden in CSS", async () => {
  const header = await readFile("src/components/Header.astro", "utf8");

  assert.match(header, /-translate-y-full sm:translate-y-0/);
  assert.doesNotMatch(header, /nav!\.style\.transform/);
});

test("shared personal hub CTA styles are defined", async () => {
  const styles = await readFile("src/styles/global.css", "utf8");

  assert.match(styles, /\.zag-cta-primary/);
  assert.match(styles, /\.zag-cta-secondary/);
  assert.match(styles, /\.zag-nav-active/);
});

test("personal hub conversion copy is centralized", async () => {
  const variables = await readFile("src/lib/variables.ts", "utf8");

  assert.match(variables, /heroEyebrow:/);
  assert.match(variables, /heroPrimaryCta:/);
  assert.match(variables, /heroSecondaryCta:/);
});

test("primary navigation exposes accessible menu state and active routes", async () => {
  const header = await readFile("src/components/Header.astro", "utf8");

  assert.match(header, /aria-expanded="false"/);
  assert.match(header, /aria-controls="primary-navigation"/);
  assert.match(header, /aria-current=\{isActive\(url\) \? "page"/);
  assert.match(header, /url="\/"/);
  assert.match(header, /filter\(\(\[label\]\) => label !== "home" && label !== "contact"\)/);
});

test("all headings use the hero's readable font", async () => {
  const files = [
    "src/pages/404.astro",
    "src/pages/about.astro",
    "src/pages/contact.astro",
    "src/pages/index.astro",
    "src/pages/projects/index.astro",
    "src/pages/services/index.astro",
    "src/pages/blog/index.astro",
    "src/pages/tags/[tag].astro",
    "src/layouts/BlogLayout.astro",
    "src/layouts/ProjectLayout.astro",
    "src/layouts/ServiceLayout.astro",
    "src/components/TagResults.astro",
    "src/components/home/FeaturedArticles.astro",
    "src/components/home/FeaturedProjects.astro",
    "src/components/home/FeaturedServices.astro",
    "src/components/home/FeaturedExperiences.astro",
  ];
  const sources = await Promise.all(files.map((file) => readFile(file, "utf8")));

  sources.forEach((source) => assert.doesNotMatch(source, /<h[1-6][^>]*font-display/));
});

test("home section headings and collection links are accessible", async () => {
  const [services, projects, articles] = await Promise.all([
    readFile("src/components/home/FeaturedServices.astro", "utf8"),
    readFile("src/components/home/FeaturedProjects.astro", "utf8"),
    readFile("src/components/home/FeaturedArticles.astro", "utf8"),
  ]);

  assert.match(services, /<h2[^>]*>\{GLOBAL\.servicesName\}<\/h2>/);
  assert.match(projects, /<h2[^>]*>\{GLOBAL\.projectsName\}<\/h2>/);
  assert.match(articles, /<h2[^>]*>\{GLOBAL\.articlesName\}<\/h2>/);
  assert.match(services, />View all services<\/Anchor>/);
  assert.match(projects, />View all projects<\/Anchor>/);
  assert.match(articles, />View all articles<\/Anchor>/);
});

test("home hero aligns the avatar to the top of the text block on desktop", async () => {
  const hero = await readFile("src/components/home/Hero.astro", "utf8");

  assert.match(hero, /items-center sm:items-start sm:flex-row/);
  assert.doesNotMatch(hero, /class="rounded-full[^\"]*mb-4/);
});

test("mobile navigation can close with Escape and return focus", async () => {
  const header = await readFile("src/components/Header.astro", "utf8");

  assert.match(header, /keydown/);
  assert.match(header, /event\.key === "Escape"/);
  assert.match(header, /button\?\.focus\(\)/);
});
