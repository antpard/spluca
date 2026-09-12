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
