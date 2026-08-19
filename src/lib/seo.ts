import { GLOBAL } from "./variables.ts";

export type JsonLd = Record<string, unknown>;

export const SITE_LANGUAGE = "en";
export const DEFAULT_SOCIAL_IMAGE = "spluca.png";

const siteRoot = GLOBAL.rootUrl.replace(/\/+$/, "");

export const absoluteUrl = (path = "") => {
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = path === "/" ? "" : path.replace(/^\/+|\/+$/g, "");
  return normalizedPath ? `${siteRoot}/${normalizedPath}` : siteRoot;
};

export const imageUrl = (path = DEFAULT_SOCIAL_IMAGE) => absoluteUrl(path);

export const sameAsLinks = () =>
  [GLOBAL.githubProfile, GLOBAL.linkedinProfile, GLOBAL.twitterProfile].filter(
    (profile): profile is string => Boolean(profile),
  );

export const personSchema = (): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${siteRoot}/#person`,
  name: GLOBAL.username,
  url: siteRoot,
  image: imageUrl(GLOBAL.profileImage),
  description: GLOBAL.longDescription,
  jobTitle: GLOBAL.shortDescription,
  sameAs: sameAsLinks(),
});

export const websiteSchema = (): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteRoot}/#website`,
  url: siteRoot,
  name: GLOBAL.username,
  description: GLOBAL.longDescription,
  publisher: { "@id": `${siteRoot}/#person` },
  inLanguage: SITE_LANGUAGE,
});

export const breadcrumbSchema = (
  items: Array<{ name: string; path: string }>,
): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

export const blogPostingSchema = (article: {
  title: string;
  description: string;
  timestamp: string;
  filename: string;
  tags?: string[];
  time: number;
}): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "@id": `${absoluteUrl(`/blog/${article.filename}`)}#article`,
  headline: article.title,
  description: article.description,
  datePublished: article.timestamp,
  dateModified: article.timestamp,
  url: absoluteUrl(`/blog/${article.filename}`),
  image: imageUrl(),
  keywords: article.tags?.join(", "),
  timeRequired: `PT${article.time}M`,
  author: { "@id": `${siteRoot}/#person` },
  publisher: { "@id": `${siteRoot}/#person` },
  inLanguage: SITE_LANGUAGE,
});

export const serviceSchema = (service: {
  title: string;
  description: string;
  filename: string;
  tags?: string[];
}): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "Service",
  name: service.title,
  description: service.description,
  url: absoluteUrl(`/services/${service.filename}`),
  image: imageUrl(),
  keywords: service.tags?.join(", "),
  provider: { "@id": `${siteRoot}/#person` },
});

export const softwareSourceCodeSchema = (project: {
  title: string;
  description: string;
  filename: string;
  tags?: string[];
  githubUrl?: string;
  liveUrl?: string;
}): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  name: project.title,
  description: project.description,
  url: absoluteUrl(`/projects/${project.filename}`),
  image: imageUrl(),
  keywords: project.tags?.join(", "),
  codeRepository: project.githubUrl,
  discussionUrl: project.liveUrl,
  author: { "@id": `${siteRoot}/#person` },
});

export const collectionPageSchema = (page: {
  name: string;
  description: string;
  path: string;
}): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: page.name,
  description: page.description,
  url: absoluteUrl(page.path),
  isPartOf: { "@id": `${siteRoot}/#website` },
});

export const contactPageSchema = (): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: GLOBAL.contactTitle,
  description: GLOBAL.contactLongDescription,
  url: absoluteUrl("/contact"),
  mainEntity: { "@id": `${siteRoot}/#person` },
});
