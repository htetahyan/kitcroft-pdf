import type { ReactNode } from "react";
import { AD_SLOTS } from "@/lib/ads";
import { AdSlot } from "./ad-slot";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { cn } from "@/lib/utils";

export function SiteShell({
  children,
  dense = false,
  hideFooter = false,
  showHeaderAd = true,
}: {
  children: ReactNode;
  dense?: boolean;
  hideFooter?: boolean;
  showHeaderAd?: boolean;
}) {
  return (
    <div className={cn("flex min-h-dvh flex-col bg-background text-foreground", dense && "h-dvh overflow-hidden")}>
      {showHeaderAd && !dense ? (
        <div className="flex justify-center border-b border-rule bg-muted/40 px-3 py-2">
          <AdSlot slot={AD_SLOTS.header} />
        </div>
      ) : null}
      <SiteHeader dense={dense} />
      {children}
      {hideFooter ? null : <SiteFooter />}
    </div>
  );
}
