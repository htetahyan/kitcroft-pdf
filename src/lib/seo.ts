import { SITE, absUrl } from "./site";

export type PageSeo = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  robots?: string;
};

const OG_IMAGE = `${SITE.url}/og.jpg`;

export function pageHead(page: PageSeo) {
  const url = absUrl(page.path);
  const keywords = [...(page.keywords ?? []), ...SITE.keywords]
    .filter((word, index, list) => list.indexOf(word) === index)
    .join(", ");

  return {
    meta: [
      { title: page.title },
      { name: "description", content: page.description },
      { name: "keywords", content: keywords },
      { name: "author", content: SITE.name },
      { name: "application-name", content: SITE.name },
      { name: "robots", content: page.robots ?? "index,follow,max-image-preview:large,max-snippet:-1" },
      { name: "googlebot", content: "index,follow" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: SITE.name },
      { property: "og:locale", content: SITE.locale },
      { property: "og:title", content: page.title },
      { property: "og:description", content: page.description },
      { property: "og:url", content: url },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:alt", content: page.title },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: page.title },
      { name: "twitter:description", content: page.description },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [
      { rel: "canonical", href: url },
      { rel: "alternate", hrefLang: "en", href: url },
      { rel: "alternate", hrefLang: "x-default", href: url },
    ],
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absUrl(item.path),
    })),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    inLanguage: "en",
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.url}/tools?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
