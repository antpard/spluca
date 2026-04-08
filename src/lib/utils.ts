import { GLOBAL } from "./variables";

type MarkdownData<T extends object> = {
  frontmatter: T;
  file: string;
  url: string;
};

const projectModules = import.meta.glob('/src/pages/projects/*.md');
const blogModules = import.meta.glob('/src/pages/blog/*.md');
const serviceModules = import.meta.glob('/src/pages/services/*.md');

export const processContentInDir = async <T extends object, K>(
  contentType: "projects" | "blog" | "services",
  processFn: (data: MarkdownData<T>) => K,
) => {
  const modules = contentType === "projects" ? projectModules
    : contentType === "services" ? serviceModules
    : blogModules;

  return Promise.all(
    Object.values(modules).map(async (loader) => {
      const data = (await loader()) as MarkdownData<T>;
      return processFn(data);
    })
  );
};

/**
 * Shortens a string by removing words at the end until it fits within a certain length.
 * @param content the content to shorten
 * @param maxLength the maximum length of the shortened content (default is 20)
 * @returns a shortened version of the content
 */
export const getShortDescription = (content: string, maxLength = 20) => {
  const splitByWord = content.split(" ");
  const length = splitByWord.length;
  return length > maxLength ? splitByWord.slice(0, maxLength).join(" ") + "..." : content;
};

/**
 * Processes the date of an article and returns a string representing the processed date.
 * @param timestamp the timestamp to process
 * @returns a string representing the processed timestamp
 */
export const processArticleDate = (timestamp: string) => {
  const date = new Date(timestamp);
  const monthSmall = date.toLocaleString("default", { month: "short" });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${monthSmall} ${day}, ${year}`;
};

/**
 * Generates a source URL for a content item. The URL is used in meta tags and social media cards.
 * @param sourceUrl the source URL of the content
 * @param contentType the type of content (either "projects" or "blog")
 * @returns a string representing the source URL with the appropriate domain
 */
export const generateSourceUrl = (
  sourceUrl: string,
  contentType: "projects" | "blog" | "services",
) => {
  return `${GLOBAL.rootUrl}/${contentType}/${sourceUrl}`;
};
