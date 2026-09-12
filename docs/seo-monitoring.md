# SEO monitoring

This site is English-only and targets international teams looking for cloud architecture, backend, Linux, Kubernetes, and platform engineering help.

## Google Search Console

1. Add `https://spluca.org/` as a Domain property, or add the URL-prefix property `https://spluca.org`.
2. Verify ownership with the DNS or HTML method provided by Google.
3. Submit `https://spluca.org/sitemap-index.xml` under **Sitemaps**.
4. Use **URL inspection** for `/services/`, each service page, `/projects/mikrom/`, `/projects/scratch/`, and new articles after publishing.
5. Review **Performance** every two weeks: clicks, impressions, CTR, average position, queries, pages, countries, and devices.

Prioritize pages with impressions but a low CTR for title and description experiments. Prioritize queries ranking between positions 5 and 20 for content improvements and stronger internal links. Do not change dates unless the content materially changed.

## Bing Webmaster Tools

1. Add `https://spluca.org/` and verify it through Search Console import or DNS.
2. Submit the same `https://spluca.org/sitemap-index.xml` sitemap.
3. Review URL inspection, indexing status, search keywords, and crawl issues monthly.

## Analytics

Use an analytics tool only after its privacy and consent requirements are understood. Track these events with descriptive names:

- `contact_email_click` for the email link;
- `contact_whatsapp_click` for the WhatsApp link;
- `service_contact_click` for service-page CTAs;
- `project_external_click` for GitHub or live-project links.

Use UTM parameters when sharing articles externally, for example:

```text
https://spluca.org/blog/rust-vs-go-for-infrastructure-backends/?utm_source=linkedin&utm_medium=social&utm_campaign=article
```

Do not add tracking scripts to this static site until the measurement need, privacy policy, and consent flow are agreed. Search Console is sufficient to start measuring organic search performance.

## Monthly review

- Export the top queries and pages from Search Console.
- Record clicks, impressions, CTR, and countries for the service pages.
- Check newly published URLs are indexed.
- Find pages with impressions but no internal link from a relevant page.
- Review broken links and redirect changes.
- Compare enquiries with the pages and channels that referred them.
