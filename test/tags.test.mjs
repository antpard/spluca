import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { createTagIndex, slugifyTag } from "../src/lib/tags.ts";

test("slugifyTag normalizes whitespace, case, and separators", () => {
  assert.equal(slugifyTag("  Cloud Architecture  "), "cloud-architecture");
  assert.equal(slugifyTag("C++ / C#"), "c-c");
});

test("createTagIndex groups duplicate tags across content types", () => {
  const index = createTagIndex({
    articles: [{ title: "Post", tags: ["Rust"] }],
    services: [{ title: "Service", tags: [" rust "] }],
    projects: [{ title: "Project", tags: ["RUST"] }],
  });

  assert.deepEqual(index, [
    {
      label: "Rust",
      slug: "rust",
      items: {
        articles: [{ title: "Post", tags: ["Rust"] }],
        services: [{ title: "Service", tags: [" rust "] }],
        projects: [{ title: "Project", tags: ["RUST"] }],
      },
    },
  ]);
});

test("all content views use the shared tag link", async () => {
  const files = [
    "src/components/ArticleSnippet.astro",
    "src/components/ServiceSnippet.astro",
    "src/components/ProjectSnippet.astro",
    "src/layouts/BlogLayout.astro",
    "src/layouts/ServiceLayout.astro",
    "src/layouts/ProjectLayout.astro",
  ];

  const tagLinkSource = await readFile("src/components/TagLink.astro", "utf8");
  assert.match(tagLinkSource, /slugifyTag/);

  for (const file of files) {
    const source = await readFile(file, "utf8");
    assert.match(source, /TagLink/);
  }
});

test("tag pages expose static paths, SEO, and all result groups", async () => {
  const route = await readFile("src/pages/tags/[tag].astro", "utf8");
  assert.match(route, /getStaticPaths/);
  assert.match(route, /getTagEntry/);
  assert.match(route, /<Seo/);
  assert.match(route, /TagResults/);
  assert.match(route, /articles/);
  assert.match(route, /services/);
  assert.match(route, /projects/);
  const results = await readFile("src/components/TagResults.astro", "utf8");
  assert.match(results, /url=\{item\.filename\}/);
});
