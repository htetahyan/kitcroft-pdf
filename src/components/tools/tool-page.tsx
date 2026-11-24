import { Link } from "@tanstack/react-router";
import { SITE, absUrl } from "@/lib/site";
import { AD_SLOTS } from "@/lib/ads";
import { getTool, type ToolDef } from "@/lib/tools";
import { AdSlot } from "@/components/layout/ad-slot";
import { SiteShell } from "@/components/layout/site-shell";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { ToolWorkspace } from "./tool-workspace";

export function ToolPage({ tool }: { tool: ToolDef }) {
  const related = tool.related.map((slug) => getTool(slug)).filter((item): item is ToolDef => Boolean(item));
  const url = absUrl(`/${tool.slug}`);

  return (
    <SiteShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: `Free ${tool.name} Online — ${SITE.name}`,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web browser",
          browserRequirements: "Requires JavaScript",
          url,
          isAccessibleForFree: true,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD", category: "Free" },
          description: tool.description,
          featureList: [
            "100% Free Online",
            "No Upload Required (Files Stay on Device)",
            "No Sign-up or Registration",
            "No File Size or Task Limits",
            "No Watermark",
            ...tool.steps.map((step) => step.title),
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: tool.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: { "@type": "Answer", text: faq.a },
          })),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: tool.h1.startsWith("Free") ? tool.h1 : `Free ${tool.h1}`,
          description: tool.lead,
          step: tool.steps.map((step, index) => ({
            "@type": "HowToStep",
            position: index + 1,
            name: step.title,
            text: step.body,
          })),
        }}
      />
      <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-8">
          <header className="space-y-3">
            <Breadcrumbs
              items={[
                { name: "Home", path: "/" },
                { name: "Free PDF Tools", path: "/tools" },
                { name: `Free ${tool.name}`, path: `/${tool.slug}`, current: true },
              ]}
            />
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                ✓ 100% Free
              </span>
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                ✓ No Sign-up
              </span>
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                ✓ Unlimited Tasks
              </span>
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                ✓ No Watermark
              </span>
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                ✓ Private (No Upload)
              </span>
            </div>
            <h1 className="font-display text-4xl font-medium tracking-tight md:text-5xl">{tool.h1.startsWith("Free") ? tool.h1 : `Free ${tool.h1}`}</h1>
            <p className="max-w-2xl text-base text-muted-foreground md:text-lg">{tool.lead}</p>
          </header>
          <AdSlot slot={AD_SLOTS.toolTop} />
          <section className="paper-sheet rounded-xl p-4 md:p-6">
            <ToolWorkspace tool={tool} />
          </section>
          <AdSlot slot={AD_SLOTS.toolAfter} className="mx-auto" />
          <section className="space-y-4">
            <h2 className="font-display text-2xl font-medium">How it works</h2>
            <ol className="grid gap-4 sm:grid-cols-3">
              {tool.steps.map((step, i) => (
                <li key={step.title} className="paper-sheet rounded-xl p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Step {i + 1}</p>
                  <p className="mt-2 font-medium">{step.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
          </section>
          <section className="space-y-3">
            <h2 className="font-display text-2xl font-medium">Why this free PDF tool</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Typical free web tools stop after three tasks an hour and cap files at 50 MB or 200 pages. Every extra step
              — merge, then compress, then number — burns another task. {SITE.name} runs {tool.name.toLowerCase()} in
              this browser. There is no task meter and the file is not sent to a processing server. Ads in the reserved
              frames keep the tools free.
            </p>
          </section>
          <section className="space-y-4">
            <h2 className="font-display text-2xl font-medium">Questions</h2>
            <dl className="space-y-4">
              {tool.faqs.map((faq) => (
                <div key={faq.q} className="border-t border-rule pt-4">
                  <dt className="font-medium">{faq.q}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{faq.a}</dd>
                </div>
              ))}
            </dl>
          </section>
          {related.length ? (
            <section className="space-y-3">
              <h2 className="font-display text-2xl font-medium">Related free PDF tools</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {related.map((item) => (
                  <li key={item.slug}>
                    <Link
                      to="/$tool"
                      params={{ tool: item.slug }}
                      className="paper-sheet paper-sheet-hover block rounded-xl p-4 no-underline"
                    >
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.short}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
        <aside className="hidden lg:block">
          <div className="sticky top-4 space-y-4">
            <AdSlot slot={AD_SLOTS.toolSidebar} />
            <div className="paper-sheet rounded-xl p-4 text-sm">
              <p className="font-medium">Stays on this device</p>
              <p className="mt-2 text-muted-foreground">
                Free, no signup, no watermark. Close the tab and the file is gone.
              </p>
            </div>
          </div>
        </aside>
      </main>
    </SiteShell>
  );
}
