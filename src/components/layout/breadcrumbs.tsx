import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";

export type Crumb = {
  name: string;
  path: string;
  current?: boolean;
};

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <JsonLd data={breadcrumbJsonLd(items)} />
      <ol
        className="flex flex-wrap items-center gap-1"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {items.map((item, index) => {
          const last = index === items.length - 1 || item.current;
          return (
            <li
              key={`${item.path}-${item.name}`}
              className="flex items-center gap-1"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {index > 0 ? <ChevronRight className="size-3.5 shrink-0 opacity-60" aria-hidden /> : null}
              {last ? (
                <span className="font-medium text-foreground" aria-current="page" itemProp="name">
                  {item.name}
                </span>
              ) : item.path === "/" ? (
                <Link to="/" className="no-underline hover:text-foreground" itemProp="item">
                  <span itemProp="name">{item.name}</span>
                </Link>
              ) : item.path === "/tools" ? (
                <Link to="/tools" className="no-underline hover:text-foreground" itemProp="item">
                  <span itemProp="name">{item.name}</span>
                </Link>
              ) : item.path === "/about" ? (
                <Link to="/about" className="no-underline hover:text-foreground" itemProp="item">
                  <span itemProp="name">{item.name}</span>
                </Link>
              ) : item.path === "/privacy" ? (
                <Link to="/privacy" className="no-underline hover:text-foreground" itemProp="item">
                  <span itemProp="name">{item.name}</span>
                </Link>
              ) : (
                <Link
                  to="/$tool"
                  params={{ tool: item.path.replace(/^\//, "") }}
                  className="no-underline hover:text-foreground"
                  itemProp="item"
                >
                  <span itemProp="name">{item.name}</span>
                </Link>
              )}
              <meta itemProp="position" content={String(index + 1)} />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
