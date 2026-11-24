import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { SITE } from "@/lib/site";
import { HERO_TOOLS, TOOLS } from "@/lib/tools";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function SiteHeader({ dense = false }: { dense?: boolean }) {
  return (
    <header className={cn("border-b border-rule bg-background/90 backdrop-blur-sm", dense ? "px-3 py-2" : "px-4 py-3")}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <Link to="/" className="flex items-baseline gap-2 no-underline">
          <span className="font-display text-xl font-medium tracking-tight text-foreground">{SITE.name}</span>
          {!dense ? (
            <span className="hidden text-xs uppercase tracking-[0.18em] text-muted-foreground sm:inline">
              PDF workbench
            </span>
          ) : null}
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {HERO_TOOLS.map((tool) => (
            <Link
              key={tool.slug}
              to="/$tool"
              params={{ tool: tool.slug }}
              className="rounded-md px-3 py-2 text-sm text-foreground/80 no-underline hover:bg-muted hover:text-foreground"
            >
              {tool.name}
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                All tools
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
              {TOOLS.map((tool) => (
                <DropdownMenuItem key={tool.slug} asChild>
                  <Link to="/$tool" params={{ tool: tool.slug }} className="w-full no-underline">
                    {tool.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild size={dense ? "sm" : "default"} className="hidden sm:inline-flex">
            <Link to="/$tool" params={{ tool: "edit-pdf" }}>
              Edit a PDF Free
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
              {TOOLS.map((tool) => (
                <DropdownMenuItem key={tool.slug} asChild>
                  <Link to="/$tool" params={{ tool: tool.slug }} className="w-full no-underline">
                    {tool.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
