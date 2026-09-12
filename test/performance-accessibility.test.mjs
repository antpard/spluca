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
