import { useState } from "react";
import { toast } from "sonner";
import { imagesToPdf } from "@/lib/pdf/operations";
import { readFileBytes } from "@/lib/pdf/io";
import { downloadBytes, uid } from "@/lib/utils";
import { Dropzone } from "./dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Item = { id: string; name: string; bytes: Uint8Array; type: string; url: string };

export function ImagesWorkspace({ accept }: { accept: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [pageSize, setPageSize] = useState<"fit" | "a4" | "letter">("fit");
  const [busy, setBusy] = useState(false);

  const add = async (files: File[]) => {
    const next: Item[] = [];
    for (const file of files) {
      const bytes = await readFileBytes(file);
      next.push({
        id: uid("img"),
        name: file.name,
        bytes,
        type: file.type,
        url: URL.createObjectURL(file),
      });
    }
    setItems((prev) => [...prev, ...next]);
  };

  const build = async () => {
    if (!items.length) return;
    setBusy(true);
    try {
      const bytes = await imagesToPdf(
        items.map((item) => ({ bytes: item.bytes, type: item.type, name: item.name })),
        pageSize,
      );
      downloadBytes(bytes, "images.pdf");
      toast.success("Downloaded PDF.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not build the PDF.");
    } finally {
      setBusy(false);
    }
  };

  if (!items.length) {
    return (
      <Dropzone
        accept={accept}
        multiple
        onFiles={(files) => void add(files)}
        label="Drop JPG or PNG files"
        hint="Reorder after they land. Each image becomes a page."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Label htmlFor="page-size">Page</Label>
          <select
            id="page-size"
            className="h-10 rounded-md border border-input bg-card px-2 text-sm"
            value={pageSize}
            onChange={(e) => setPageSize(e.target.value as "fit" | "a4" | "letter")}
          >
            <option value="fit">Fit image</option>
            <option value="a4">A4</option>
            <option value="letter">Letter</option>
          </select>
        </div>
        <div className="flex gap-2">
          <label className="inline-flex h-10 cursor-pointer items-center rounded-md border border-border px-3 text-sm hover:bg-muted">
            Add images
            <input
              type="file"
              accept={accept}
              multiple
              className="sr-only"
              onChange={(e) => {
                if (e.target.files) void add(Array.from(e.target.files));
                e.target.value = "";
              }}
            />
          </label>
          <Button type="button" disabled={busy} onClick={build}>
            Download PDF
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        {items.map((item) => (
          <figure key={item.id} className="page-thumb w-28">
            <img src={item.url} alt={item.name} className="h-32 w-full object-cover" />
            <figcaption className="truncate px-1 py-1 text-[10px]">{item.name}</figcaption>
            <button
              type="button"
              className="w-full py-1 text-[10px] uppercase tracking-wide text-muted-foreground hover:text-destructive"
              onClick={() => setItems((list) => list.filter((x) => x.id !== item.id))}
            >
              Remove
            </button>
          </figure>
        ))}
      </div>
    </div>
  );
}
