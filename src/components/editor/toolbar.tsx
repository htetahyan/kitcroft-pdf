import {
  Download,
  Highlighter,
  ImagePlus,
  MousePointer2,
  Move,
  PenLine,
  Redo2,
  Square,
  Type,
  Undo2,
  FileSignature,
} from "lucide-react";
import type { EditorTool } from "./types";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const TOOLS: { id: EditorTool; label: string; icon: typeof Type }[] = [
  { id: "select", label: "Select / edit", icon: MousePointer2 },
  { id: "move", label: "Move", icon: Move },
  { id: "text", label: "Add text", icon: Type },
  { id: "highlight", label: "Highlight", icon: Highlighter },
  { id: "draw", label: "Draw", icon: PenLine },
  { id: "rect", label: "Box", icon: Square },
  { id: "image", label: "Image", icon: ImagePlus },
  { id: "signature", label: "Sign", icon: FileSignature },
];

export function EditorToolbar({
  tool,
  onTool,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onDownload,
  busy,
}: {
  tool: EditorTool;
  onTool: (tool: EditorTool) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onDownload: () => void;
  busy: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-rule bg-card px-2 py-2">
      <div className="flex flex-wrap items-center gap-1">
        {TOOLS.map((item) => {
          const Icon = item.icon;
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon-sm"
                  variant={tool === item.id ? "default" : "ghost"}
                  aria-label={item.label}
                  aria-pressed={tool === item.id}
                  onClick={() => onTool(item.id)}
                  className={cn(tool === item.id && "shadow-none")}
                >
                  <Icon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
      <Button type="button" size="icon-sm" variant="ghost" aria-label="Undo" disabled={!canUndo} onClick={onUndo}>
        <Undo2 />
      </Button>
      <Button type="button" size="icon-sm" variant="ghost" aria-label="Redo" disabled={!canRedo} onClick={onRedo}>
        <Redo2 />
      </Button>
      <p className="ml-2 hidden text-xs text-muted-foreground lg:block">
        Click text to type · drag the grip or use Move
      </p>
      <div className="ml-auto">
        <Button type="button" onClick={onDownload} disabled={busy}>
          <Download />
          {busy ? "Preparing" : "Download PDF"}
        </Button>
      </div>
    </div>
  );
}
