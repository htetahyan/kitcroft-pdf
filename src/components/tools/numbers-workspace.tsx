import { useState } from "react";
import { toast } from "sonner";
import { numberPages, type NumberOpts } from "@/lib/pdf/operations";
import { readFileBytes, pageCount as pdfPageCount } from "@/lib/pdf/io";
import { buildSamplePdf } from "@/lib/pdf/sample";
import { downloadBytes, slugFile } from "@/lib/utils";
import { Dropzone } from "./dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NumbersWorkspace({ accept }: { accept: string }) {
  const [file, setFile] = useState<{ name: string; bytes: Uint8Array; pages: number } | null>(null);
  const [format, setFormat] = useState<NumberOpts["format"]>("n-of");
  const [position, setPosition] = useState<NumberOpts["position"]>("bottom-center");
  const [start, setStart] = useState(1);
  const [busy, setBusy] = useState(false);

  const open = async (incoming: File | { name: string; bytes: Uint8Array }) => {
    try {
      const bytes = incoming instanceof File ? await readFileBytes(incoming) : incoming.bytes;
      const name = incoming instanceof File ? incoming.name : incoming.name;
      setFile({ name, bytes, pages: await pdfPageCount(bytes) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open that PDF.");
    }
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const bytes = await numberPages(file.bytes, {
        format,
        position,
        start,
        fontSize: 11,
        color: "#1a1916",
      });
      downloadBytes(bytes, slugFile(file.name, "-numbered.pdf"));
      toast.success("Downloaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not number pages.");
    } finally {
      setBusy(false);
    }
  };

  if (!file) {
    return (
      <div className="space-y-4">
        <Dropzone accept={accept} multiple={false} onFiles={(f) => void open(f[0])} label="Drop a PDF to number" />
        <div className="flex justify-center">
          <Button type="button" variant="outline" onClick={async () => open(await buildSamplePdf())}>
            Open sample PDF
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid max-w-lg gap-4">
      <p className="text-sm text-muted-foreground">
        {file.name} · {file.pages} pages
      </p>
      <div className="space-y-2">
        <Label htmlFor="fmt">Format</Label>
        <select
          id="fmt"
          className="h-10 w-full rounded-md border border-input bg-card px-2 text-sm"
          value={format}
          onChange={(e) => setFormat(e.target.value as NumberOpts["format"])}
        >
          <option value="n">1</option>
          <option value="page-n">Page 1</option>
          <option value="n-of">1 / N</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pos">Position</Label>
        <select
          id="pos"
          className="h-10 w-full rounded-md border border-input bg-card px-2 text-sm"
          value={position}
          onChange={(e) => setPosition(e.target.value as NumberOpts["position"])}
        >
          <option value="bottom-center">Bottom center</option>
          <option value="bottom-right">Bottom right</option>
          <option value="bottom-left">Bottom left</option>
          <option value="top-center">Top center</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="start">Start at</Label>
        <Input
          id="start"
          type="number"
          min={1}
          value={start}
          onChange={(e) => setStart(Number(e.target.value) || 1)}
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" disabled={busy} onClick={run}>
          Download
        </Button>
        <Button type="button" variant="ghost" onClick={() => setFile(null)}>
          Start over
        </Button>
      </div>
    </div>
  );
}
