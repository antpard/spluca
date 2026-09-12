import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { absoluteUrl, itemListSchema, sameAsLinks } from "../src/lib/seo.ts";

test("itemListSchema exposes service names and canonical URLs", () => {
  assert.deepEqual(itemListSchema({
    path: "/services",
    items: [
      { title: "Cloud Architecture", filename: "cloud-architecture" },
      { title: "Backend Development", filename: "backend-development" },
    ],
  }), {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Cloud Architecture, Backend & Linux Services",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Cloud Architecture",
        url: "https://spluca.org/services/cloud-architecture",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Backend Development",
        url: "https://spluca.org/services/backend-development",
      },
    ],
  });
});

test("absoluteUrl normalizes site paths without trailing slashes", () => {
  assert.equal(absoluteUrl("/blog/example"), "https://spluca.org/blog/example");
  assert.equal(absoluteUrl("/"), "https://spluca.org");
  assert.equal(absoluteUrl("https://example.com/page"), "https://example.com/page");
});

test("sameAsLinks excludes empty social profiles", () => {
  assert.deepEqual(sameAsLinks(), [
    "https://github.com/antpard",
    "https://www.linkedin.com/in/antpard",
  ]);
});

test("services page contains international positioning and internal conversion links", async () => {
  const page = await readFile("src/pages/services/index.astro", "utf8");

  assert.match(page, /Cloud, Backend &(?:amp;|&) Linux Engineering Services/);
  assert.match(page, /Why work with me/);
  assert.match(page, /href="\/projects"/);
  assert.match(page, /href="\/blog"/);
  assert.match(page, /href="\/contact"/);
});

test("services include focused pages for Kubernetes and systems backend work", async () => {
  const servicePages = await Promise.all([
    readFile("src/pages/services/kubernetes-platform-engineering.md", "utf8"),
    readFile("src/pages/services/rust-go-backend-development.md", "utf8"),
  ]);

  assert.match(servicePages[0], /title: "Kubernetes Platform Engineering/);
  assert.match(servicePages[0], /reliable Kubernetes platform/);
  assert.match(servicePages[1], /title: "Rust & Go Backend Development/);
  assert.match(servicePages[1], /Production backend services/);
});
