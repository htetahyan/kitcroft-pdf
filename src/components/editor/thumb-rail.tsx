import { FilePlus, Plus, RotateCw, Trash2 } from "lucide-react";
import type { ChangeEvent, DragEvent } from "react";
import { PageThumb } from "@/components/tools/page-thumb";
import { Button } from "@/components/ui/button";
import type { PageRef } from "./types";
import { cn } from "@/lib/utils";

export function ThumbRail({
  pages,
  currentId,
  onSelect,
  onRotate,
  onDelete,
  onInsertBlank,
  onInsertPdf,
  onReorder,
}: {
  pages: PageRef[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onRotate: (id: string) => void;
  onDelete: (id: string) => void;
  onInsertBlank: (afterId: string) => void;
  onInsertPdf: (file: File, afterId: string) => void;
  onReorder: (from: number, to: number) => void;
}) {
  const fileRefId = { current: "" as string };

  const onPdf = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const afterId = fileRefId.current || pages[pages.length - 1]?.id;
    if (file && afterId) onInsertPdf(file, afterId);
    event.target.value = "";
  };

  return (
    <aside className="flex gap-2 overflow-x-auto border-b border-rule bg-muted/40 p-2 lg:h-full lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r">
      {pages.map((page, index) => (
        <div
          key={page.id}
          draggable
          onDragStart={(e: DragEvent) => {
            e.dataTransfer.setData("text/page-index", String(index));
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const from = Number(e.dataTransfer.getData("text/page-index"));
            if (Number.isFinite(from)) onReorder(from, index);
          }}
          className="relative shrink-0"
        >
          {page.source.kind === "pdf" ? (
            <PageThumb
              bytes={page.source.bytes}
              pageIndex={page.source.index}
              rotation={page.rotation}
              selected={page.id === currentId}
              onClick={() => onSelect(page.id)}
              label={`${index + 1}`}
            />
          ) : (
            <button
              type="button"
              onClick={() => onSelect(page.id)}
              className={cn(
                "page-thumb flex h-36 w-[108px] items-center justify-center text-xs text-muted-foreground",
                page.id === currentId && "ring-2 ring-primary",
              )}
            >
              Blank {index + 1}
            </button>
          )}
          <div className="mt-1 flex justify-center gap-0.5">
            <Button type="button" size="icon-sm" variant="ghost" aria-label="Rotate page" onClick={() => onRotate(page.id)}>
              <RotateCw />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Insert blank after"
              onClick={() => onInsertBlank(page.id)}
            >
              <Plus />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Delete page"
              disabled={pages.length === 1}
              onClick={() => onDelete(page.id)}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      ))}
      <label className="flex h-36 w-[108px] shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-rule text-xs text-muted-foreground hover:bg-card">
        <FilePlus className="size-4" />
        Insert PDF
        <input
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(e) => {
            fileRefId.current = currentId || pages[pages.length - 1]?.id || "";
            onPdf(e);
          }}
        />
      </label>
    </aside>
  );
}
