import { Link } from "@tanstack/react-router";
import { SITE } from "@/lib/site";
import { TOOLS } from "@/lib/tools";
import { AD_SLOTS } from "@/lib/ads";
import { AdSlot } from "./ad-slot";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-rule bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10">
        <div className="flex justify-center">
          <AdSlot slot={AD_SLOTS.footer} />
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-display text-lg">{SITE.name}</p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">{SITE.tagline}. No account. No task meter.</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Free PDF tools</p>
            <ul className="mt-3 grid grid-cols-1 gap-1 text-sm">
              {TOOLS.map((tool) => (
                <li key={tool.slug}>
                  <Link to="/$tool" params={{ tool: tool.slug }} className="text-foreground/80 no-underline hover:text-foreground">
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Site</p>
            <ul className="mt-3 space-y-1 text-sm">
              <li>
                <Link to="/tools" className="text-foreground/80 no-underline hover:text-foreground">
                  All PDF tools
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-foreground/80 no-underline hover:text-foreground">
                  About
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-foreground/80 no-underline hover:text-foreground">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Files are processed in this browser. Closing the tab discards them. {SITE.name} does not run a processing server.
        </p>
      </div>
    </footer>
  );
}
