import type {
  ArticleFrontmatter,
  ProjectFrontmatter,
  ServiceFrontmatter,
} from "./types";

export type TaggableItem =
  | ArticleFrontmatter
  | ProjectFrontmatter
  | ServiceFrontmatter;

export type TagIndexInput = {
  articles: TaggableItem[];
  services: TaggableItem[];
  projects: TaggableItem[];
};

export type TagEntry = {
  label: string;
  slug: string;
  items: TagIndexInput;
};

export function slugifyTag(tag: string): string {
  return tag
    .trim()
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

export function createTagIndex(input: TagIndexInput): TagEntry[] {
  const entries = new Map<string, TagEntry>();

  for (const [kind, items] of Object.entries(input) as [
    keyof TagIndexInput,
    TaggableItem[],
  ][]) {
    for (const item of items) {
      for (const rawTag of item.tags ?? []) {
        const label = rawTag.trim();
        const slug = slugifyTag(label);
        if (!slug) continue;

        let entry = entries.get(slug);
        if (!entry) {
          entry = {
            label,
            slug,
            items: { articles: [], services: [], projects: [] },
          };
          entries.set(slug, entry);
        }

        if (!entry.items[kind].includes(item)) {
          entry.items[kind].push(item);
        }
      }
    }
  }

  return [...entries.values()].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
  );
}

export function getTagEntry(
  entries: TagEntry[],
  slug: string,
): TagEntry | undefined {
  const normalizedSlug = slugifyTag(slug);
  return entries.find((entry) => entry.slug === normalizedSlug);
}
