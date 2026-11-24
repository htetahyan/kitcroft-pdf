import { createFileRoute } from "@tanstack/react-router";
import { SITE } from "@/lib/site";
import { pageHead } from "@/lib/seo";
import { SiteShell } from "@/components/layout/site-shell";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export const Route = createFileRoute("/about")({
  head: () =>
    pageHead({
      title: `About ${SITE.name} — Free In-Browser PDF Tools, No Upload`,
      description: `${SITE.name} is a free PDF workbench. Edit, merge, and compress in the browser with no task meter, no signup, and no uploads.`,
      path: "/about",
      keywords: ["about kitcroft", "free pdf workbench", "private pdf editor", "no upload pdf tools"],
    }),
  component: About,
});

function About() {
  return (
    <SiteShell>
      <main className="mx-auto max-w-2xl px-4 py-14">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "About", path: "/about", current: true },
          ]}
        />
        <h1 className="mt-4 font-display text-4xl font-medium">About {SITE.name}</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            A croft is a small independent holding. Kitcroft is one for browser tools — PDF first, then whatever else
            belongs on the yard. Files stay on this device. Never uploaded, never metered.
          </p>
          <p>
            {SITE.name} is a free PDF workbench that runs entirely in the browser. The three tools people actually use —
            edit, merge, compress — sit up front. The rest of the bench (split, rotate, watermark, images) shares the same
            local engine.
          </p>
          <p>
            Metered web tools made sense when browsers could not assemble PDFs. That is no longer true. Keeping the file
            on the device removes the need for an hourly cap, a 50 MB wall, or an account wall.
          </p>
          <p>
            The product is supported by reserved advertisement frames, not by locking the download. Those frames are
            labelled and held in layout so a network tag can drop in later without shoving the canvas.
          </p>
        </div>
      </main>
    </SiteShell>
  );
}
