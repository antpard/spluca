import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

import { absoluteUrl, faqPageSchema, itemListSchema, sameAsLinks } from "../src/lib/seo.ts";

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

test("home article section limits the list to five and links to the full blog", async () => {
  const homeArticles = await readFile("src/components/home/FeaturedArticles.astro", "utf8");

  assert.match(homeArticles, /featuredArticles\.slice\(0, 5\)/);
  assert.match(homeArticles, /<Anchor url="\/blog"/);
});

test("home article data includes all blog posts before the display limit", async () => {
  const featuredData = await readFile("src/lib/featured.ts", "utf8");
  const articleBlock = featuredData.slice(featuredData.indexOf("export const featuredArticles"));

  assert.doesNotMatch(articleBlock, /\.filter\(\(project\) => project\.featured\)/);
  assert.match(articleBlock, /\.sort\(\(a, b\) =>/);
});

test("home exposes both conversion and proof paths", async () => {
  const [home, hero] = await Promise.all([
    readFile("src/pages/index.astro", "utf8"),
    readFile("src/components/home/Hero.astro", "utf8"),
  ]);

  assert.match(home, /url="\/contact"/);
  assert.match(hero, /GLOBAL\.heroEyebrow/);
  assert.match(hero, /GLOBAL\.heroProof/);
  assert.match(hero, /url="\/projects"/);
});

test("home sections have distinct service, project, and editorial hierarchy", async () => {
  const home = await readFile("src/pages/index.astro", "utf8");

  assert.ok(home.indexOf("<FeaturedServices") < home.indexOf("<FeaturedProjects"));
  assert.ok(home.indexOf("<FeaturedProjects") < home.indexOf("<FeaturedArticles"));
  assert.match(home, /Have a difficult system to solve/);
  assert.match(home, /url="\/contact"/);
});

test("home previews preserve useful metadata and descriptive project actions", async () => {
  const [articles, projects] = await Promise.all([
    readFile("src/components/home/FeaturedArticles.astro", "utf8"),
    readFile("src/components/ProjectSnippet.astro", "utf8"),
  ]);

  assert.match(articles, /featuredArticles\.slice\(0, 5\)/);
  assert.match(articles, /timestamp/);
  assert.match(articles, /duration/);
  assert.match(projects, /View repository/);
  assert.match(projects, /Open live product/);
});

test("faqPageSchema exposes question and answer entities", () => {
  assert.deepEqual(faqPageSchema([
    { question: "Who is this service for?", answer: "International engineering teams." },
  ]), {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [{
      "@type": "Question",
      name: "Who is this service for?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "International engineering teams.",
      },
    }],
  });
});

test("services page contains useful questions and answers", async () => {
  const page = await readFile("src/pages/services/index.astro", "utf8");

  assert.match(page, /Frequently asked questions/);
  assert.match(page, /Do you work with international teams\?/);
  assert.match(page, /href="\/contact"/);
});

test("older articles have specific metadata and internal discovery links", async () => {
  const [microvms, grpc, knative, axum] = await Promise.all([
    readFile("src/pages/blog/micro-virtual-machines.md", "utf8"),
    readFile("src/pages/blog/understanding-grpc-and-protocol-buffers.md", "utf8"),
    readFile("src/pages/blog/knative-simplifying-serverless-development-on-kubernetes.md", "utf8"),
    readFile("src/pages/blog/getting-started-with-axum-and-tokio.md", "utf8"),
  ]);

  assert.match(microvms, /title: "MicroVMs for Secure Multi-Tenant Edge Workloads"/);
  assert.match(microvms, /\]\(\/projects\/mikrom\)/);
  assert.match(grpc, /title: "gRPC and Protocol Buffers for Backend Services"/);
  assert.match(grpc, /\]\(\/services\/backend-development\)/);
  assert.match(knative, /title: "Knative for Serverless Workloads on Kubernetes"/);
  assert.match(knative, /\]\(\/services\/kubernetes-platform-engineering\)/);
  assert.match(axum, /title: "Building a REST API with Axum and Tokio"/);
  assert.match(axum, /\]\(\/services\/backend-development\)/);
});

test("blog Open Graph metadata includes article section and tags", async () => {
  const [seo, blogLayout] = await Promise.all([
    readFile("src/components/Seo.astro", "utf8"),
    readFile("src/layouts/BlogLayout.astro", "utf8"),
  ]);

  assert.match(seo, /articleSection\?: string/);
  assert.match(seo, /articleTags\?: string\[\]/);
  assert.match(seo, /property="article:section"/);
  assert.match(seo, /property="article:tag"/);
  assert.match(blogLayout, /articleSection="Technical articles"/);
  assert.match(blogLayout, /articleTags=\{frontmatter\.tags\}/);
});

test("about page is discoverable and positioned for international clients", async () => {
  const [page, variables] = await Promise.all([
    readFile("src/pages/about.astro", "utf8"),
    readFile("src/lib/variables.ts", "utf8"),
  ]);

  assert.match(variables, /about: "\/about"/);
  assert.match(page, /title=\{`\$\{GLOBAL\.aboutTitle\}/);
  assert.match(page, /international teams/);
  assert.match(page, /href="\/services"/);
  assert.match(page, /href="\/contact"/);
});

test("service metadata matches high-intent international searches", async () => {
  const [cloud, kubernetes, backend, linux] = await Promise.all([
    readFile("src/pages/services/cloud-architecture.md", "utf8"),
    readFile("src/pages/services/kubernetes-platform-engineering.md", "utf8"),
    readFile("src/pages/services/backend-development.md", "utf8"),
    readFile("src/pages/services/linux-system-administration.md", "utf8"),
  ]);

  assert.match(cloud, /cloud infrastructure consulting/);
  assert.match(kubernetes, /Kubernetes platform consulting/);
  assert.match(backend, /Backend development for international teams/);
  assert.match(linux, /Linux server hardening/);
});

test("service introductions describe client problems before listing technologies", async () => {
  const [cloud, kubernetes, backend, linux] = await Promise.all([
    readFile("src/pages/services/cloud-architecture.md", "utf8"),
    readFile("src/pages/services/kubernetes-platform-engineering.md", "utf8"),
    readFile("src/pages/services/backend-development.md", "utf8"),
    readFile("src/pages/services/linux-system-administration.md", "utf8"),
  ]);

  assert.match(cloud, /reliability, security, or operating costs/);
  assert.match(kubernetes, /delivery bottlenecks or operational risk/);
  assert.match(backend, /slow delivery, unreliable integrations, or difficult-to-change services/);
  assert.match(linux, /security gaps, recurring incidents, or unclear operational ownership/);
});
