import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { articles } from '../lib/list';
import { GLOBAL } from '../lib/variables';

export async function GET(context: APIContext) {
  return rss({
    title: `${GLOBAL.username} — ${GLOBAL.blogTitle}`,
    description: GLOBAL.blogLongDescription,
    site: context.site ?? GLOBAL.rootUrl,
    items: articles.map((article) => ({
      title: article.title,
      description: article.description,
      pubDate: new Date(article.timestamp),
      link: article.filename,
    })),
  });
}
