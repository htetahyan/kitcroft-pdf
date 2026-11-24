import { createFileRoute, Link } from "@tanstack/react-router";
import { SITE } from "@/lib/site";
import { pageHead } from "@/lib/seo";
import { TOOLS } from "@/lib/tools";
import { SiteShell } from "@/components/layout/site-shell";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export const Route = createFileRoute("/tools")({
  head: () =>
    pageHead({
      title: `Free PDF Tools Online — Edit, Merge, Compress & More | ${SITE.name}`,
      description:
        "Free PDF tools in your browser: edit PDF, merge PDF, compress PDF, split, rotate, watermark, JPG to PDF, and sign. No upload, no signup, unlimited tasks.",
      path: "/tools",
      keywords: [
        "free pdf tools",
        "pdf tools online free",
        "edit pdf free",
        "merge pdf free",
        "compress pdf free",
        "pdf editor no upload",
      ],
    }),
  component: ToolsIndex,
});

function ToolsIndex() {
  return (
    <SiteShell>
      <main className="mx-auto max-w-6xl px-4 py-12">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Free PDF Tools", path: "/tools", current: true },
          ]}
        />
        <h1 className="mt-4 font-display text-4xl font-medium tracking-tight">100% Free PDF tools online</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Every job runs in the browser — 100% free, unlimited, and private. Start with edit, merge, or compress, then use the
          rest of the bench without a task meter or watermark.
        </p>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => (
            <li key={tool.slug}>
              <Link
                to="/$tool"
                params={{ tool: tool.slug }}
                className="paper-sheet paper-sheet-hover block h-full rounded-xl p-5 no-underline"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-foreground">{tool.name}</p>
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-primary">
                    100% FREE
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{tool.short}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </SiteShell>
  );
}
