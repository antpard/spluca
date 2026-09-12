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

test("article typography is isolated from the global stylesheet", async () => {
  const globalStyles = await readFile("src/styles/global.css", "utf8");
  const prose = await readFile("src/styles/prose.css", "utf8");

  assert.doesNotMatch(globalStyles, /@plugin "@tailwindcss\/typography"/);
  assert.match(prose, /@plugin "@tailwindcss\/typography"/);
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
