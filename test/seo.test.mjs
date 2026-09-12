import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

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

test("itemListSchema supports project and article collection names", () => {
  assert.equal(itemListSchema({
    name: "Projects and Code",
    path: "/projects",
    items: [{ title: "Mikrom", filename: "mikrom" }],
  }).name, "Projects and Code");

  assert.equal(itemListSchema({
    name: "Technical Articles",
    path: "/blog",
    items: [{ title: "MicroVMs", filename: "micro-virtual-machines" }],
  }).itemListElement[0].url, "https://spluca.org/blog/micro-virtual-machines");
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

test("services include focused Kubernetes work without duplicate backend pages", async () => {
  const [kubernetesPage, backendPage, serviceFiles] = await Promise.all([
    readFile("src/pages/services/kubernetes-platform-engineering.md", "utf8"),
    readFile("src/pages/services/backend-development.md", "utf8"),
    readdir("src/pages/services"),
  ]);

  assert.match(kubernetesPage, /title: "Kubernetes Platform Engineering/);
  assert.match(kubernetesPage, /reliable Kubernetes platform/);
  assert.match(backendPage, /title: "Backend Development — Ruby, Go & Rust/);
  assert.equal(serviceFiles.filter((file) => file.includes("backend-development")).length, 1);
});

test("project pages expose evidence-based case studies with service links", async () => {
  const [mikrom, scratch] = await Promise.all([
    readFile("src/pages/projects/mikrom.md", "utf8"),
    readFile("src/pages/projects/scratch.md", "utf8"),
  ]);

  assert.match(mikrom, /## Case study: building an isolated edge platform/);
  assert.match(mikrom, /\]\(\/services\/kubernetes-platform-engineering\)/);
  assert.match(scratch, /## Case study: operating reliable data extraction/);
  assert.match(scratch, /\]\(\/services\/backend-development\)/);
});

test("service layout provides a descriptive contact conversion link", async () => {
  const layout = await readFile("src/layouts/ServiceLayout.astro", "utf8");

  assert.match(layout, /href="\/contact"/);
  assert.match(layout, /discuss your infrastructure needs/);
});

test("project case studies provide a descriptive contact link", async () => {
  const [mikrom, scratch] = await Promise.all([
    readFile("src/pages/projects/mikrom.md", "utf8"),
    readFile("src/pages/projects/scratch.md", "utf8"),
  ]);

  assert.match(mikrom, /\]\(\/contact\)/);
  assert.match(scratch, /\]\(\/contact\)/);
});

test("SEO articles target focused infrastructure questions and link to relevant services", async () => {
  const articles = await Promise.all([
    readFile("src/pages/blog/designing-a-reliable-kubernetes-platform.md", "utf8"),
    readFile("src/pages/blog/rust-vs-go-for-infrastructure-backends.md", "utf8"),
    readFile("src/pages/blog/microvms-vs-containers-for-multitenant-workloads.md", "utf8"),
  ]);

  assert.match(articles[0], /title: "Designing a Reliable Kubernetes Platform for Small Teams"/);
  assert.match(articles[0], /\]\(\/services\/kubernetes-platform-engineering\)/);
  assert.match(articles[1], /title: "Rust vs Go for Infrastructure Backends"/);
  assert.match(articles[1], /\]\(\/services\/backend-development\)/);
  assert.match(articles[2], /title: "MicroVMs vs Containers for Multi-Tenant Workloads"/);
  assert.match(articles[2], /\]\(\/services\/cloud-architecture\)/);
});

test("new SEO articles follow the blog's emoji heading style", async () => {
  const articles = await Promise.all([
    readFile("src/pages/blog/designing-a-reliable-kubernetes-platform.md", "utf8"),
    readFile("src/pages/blog/rust-vs-go-for-infrastructure-backends.md", "utf8"),
    readFile("src/pages/blog/microvms-vs-containers-for-multitenant-workloads.md", "utf8"),
  ]);

  assert.match(articles[0], /# 🧭 Designing a Reliable Kubernetes Platform for Small Teams/);
  assert.match(articles[1], /# 🦀 Rust vs Go for Infrastructure Backends/);
  assert.match(articles[2], /# 🧱 MicroVMs vs Containers for Multi-Tenant Workloads/);
});
