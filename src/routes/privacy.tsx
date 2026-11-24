import { createFileRoute } from "@tanstack/react-router";
import { SITE } from "@/lib/site";
import { pageHead } from "@/lib/seo";
import { SiteShell } from "@/components/layout/site-shell";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export const Route = createFileRoute("/privacy")({
  head: () =>
    pageHead({
      title: `Privacy Policy — Free PDF Tools Stay on Your Device | ${SITE.name}`,
      description: `${SITE.name} processes PDFs in your browser. Files are not uploaded to a processing server. No account, no file copy.`,
      path: "/privacy",
      keywords: ["kitcroft privacy", "pdf no upload", "private pdf editor", "browser pdf tools privacy"],
    }),
  component: Privacy,
});

function Privacy() {
  return (
    <SiteShell>
      <main className="mx-auto max-w-2xl px-4 py-14">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Privacy", path: "/privacy", current: true },
          ]}
        />
        <h1 className="mt-4 font-display text-4xl font-medium">Privacy</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            PDF files you open in {SITE.name} are read in this browser. They are not posted to a conversion server. Closing
            the tab discards the bytes still in memory.
          </p>
          <p>
            Downloads are produced locally and saved through the browser’s own save dialog. We do not receive a copy.
          </p>
          <p>
            If advertisement tags are added later, those third parties may set cookies or collect standard ad metrics on
            page views — not on the contents of your PDFs, which never leave the tab.
          </p>
          <p>
            This page is the whole policy on file handling. There is no account, so there is no account database.
          </p>
        </div>
      </main>
    </SiteShell>
  );
}
