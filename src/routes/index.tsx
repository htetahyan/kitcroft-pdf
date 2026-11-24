import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Lock, Infinity as InfinityIcon, Monitor } from "lucide-react";
import { SITE } from "@/lib/site";
import { pageHead, websiteJsonLd } from "@/lib/seo";
import { AD_SLOTS } from "@/lib/ads";
import { HERO_TOOLS, OTHER_TOOLS } from "@/lib/tools";
import { AdSlot } from "@/components/layout/ad-slot";
import { SiteShell } from "@/components/layout/site-shell";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead({
      title: `Free PDF Editor Online — Merge & Compress, No Upload | ${SITE.name}`,
      description:
        "Free PDF editor, merge PDF, and compress PDF in your browser. No upload, no signup, no 3-tasks-per-hour cap. Unlimited tools, files stay on your device.",
      path: "/",
      keywords: [
        "free pdf editor online",
        "edit pdf free",
        "merge pdf online free",
        "compress pdf free no upload",
        "free pdf tools",
      ],
    }),
  component: Home,
});

function Home() {
  return (
    <SiteShell>
      <JsonLd data={websiteJsonLd()} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: SITE.name,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web browser",
          description: SITE.description,
          url: SITE.url,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          featureList: HERO_TOOLS.map((t) => t.name),
        }}
      />
      <main>
        <section className="border-b border-rule">
          <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
            <Breadcrumbs items={[{ name: "Home", path: "/", current: true }]} />
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
              {SITE.name} · free PDF workbench
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-medium leading-[1.12] tracking-tight md:text-6xl">
              Free PDF editor, merge, and compress — in this tab.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Unlimited free PDF tools. No upload, no signup, no watermark. Files never leave the device. Ads in the
              reserved frames keep every tool free.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/$tool" params={{ tool: "edit-pdf" }}>
                  Edit a PDF free
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/tools">All free PDF tools</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="font-display text-3xl font-medium">The three most-used free PDF tools</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Same trio people search first: edit PDF online free, merge PDF free, compress PDF free. Here they run
            locally, so merge-then-compress does not spend two of three hourly tokens.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {HERO_TOOLS.map((tool, index) => (
              <Link
                key={tool.slug}
                to="/$tool"
                params={{ tool: tool.slug }}
                className="paper-sheet paper-sheet-hover flex flex-col rounded-xl p-6 no-underline"
              >
                <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">0{index + 1}</span>
                <h3 className="mt-3 font-display text-2xl font-medium text-foreground">{tool.name}</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{tool.short}</p>
                <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Open free <ArrowRight className="size-4" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="flex justify-center px-4 py-4">
          <AdSlot slot={AD_SLOTS.homeMid} />
        </div>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="font-display text-3xl font-medium">Against a metered free tier</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-rule">
                  <th className="py-3 pr-4 font-medium"> </th>
                  <th className="py-3 pr-4 font-medium">{SITE.name}</th>
                  <th className="py-3 font-medium">Typical metered web tools</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                {[
                  ["Where the file goes", "This browser only", "Uploaded to a server"],
                  ["Free tasks", "Unlimited", "Often 3 per hour"],
                  ["Free size / pages", "Device memory", "Often 50 MB or 200 pages"],
                  ["Watermark", "None", "Sometimes on edit/sign"],
                  ["Signup", "Not required", "Often for anything beyond a trial"],
                ].map((row) => (
                  <tr key={row[0]} className="border-b border-rule/70">
                    <td className="py-3 pr-4 text-foreground">{row[0]}</td>
                    <td className="py-3 pr-4">{row[1]}</td>
                    <td className="py-3">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Fact icon={Lock} title="Private by architecture" body="There is no upload pipeline. Close the tab and the bytes are gone." />
            <Fact icon={InfinityIcon} title="No task meter" body="Merge, then edit, then compress in one sitting. Nothing clocks out." />
            <Fact icon={Monitor} title="Works after the page loads" body="Once the app is open, processing does not wait on a job queue." />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-3xl font-medium">More free PDF tools</h2>
            <Link to="/tools" className="text-sm text-primary no-underline hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {OTHER_TOOLS.map((tool) => (
              <Link
                key={tool.slug}
                to="/$tool"
                params={{ tool: tool.slug }}
                className="rounded-xl border border-border bg-card px-4 py-4 no-underline hover:border-primary/40"
              >
                <p className="font-medium text-foreground">{tool.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{tool.short}</p>
              </Link>
            ))}
          </div>
        </section>

        <div className="flex justify-center px-4">
          <AdSlot slot={AD_SLOTS.homeLower} />
        </div>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="font-display text-3xl font-medium">Questions</h2>
          <dl className="mt-6 max-w-3xl space-y-5">
            <div>
              <dt className="font-medium">What are the three most-used PDF tools?</dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Edit, merge, and compress. They lead Sejda’s “most popular” list and match the highest-volume jobs in
                every public PDF suite: fix a page, stack files, shrink a scan.
              </dd>
            </div>
            <div>
              <dt className="font-medium">Do you rewrite existing PDF text like a word processor?</dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Digital text can be clicked and typed in place. Scans need a new text box. Files stay in this tab.
              </dd>
            </div>
            <div>
              <dt className="font-medium">Is Kitcroft really free?</dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Yes. No task cap, no watermark, no account. Reserved ad frames around the tools keep the workbench free.
              </dd>
            </div>
          </dl>
        </section>
      </main>
    </SiteShell>
  );
}

function Fact({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Lock;
  title: string;
  body: string;
}) {
  return (
    <div className="paper-sheet rounded-xl p-5">
      <Icon className="size-5 text-primary" />
      <p className="mt-3 font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
