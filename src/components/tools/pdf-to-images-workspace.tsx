import { useState } from "react";
import { toast } from "sonner";
import { pdfPagesToImages, downloadImageZip } from "@/lib/pdf/images";
import { readFileBytes, pageCount as pdfPageCount } from "@/lib/pdf/io";
import { buildSamplePdf } from "@/lib/pdf/sample";
import { slugFile } from "@/lib/utils";
import { Dropzone } from "./dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";

export function PdfToImagesWorkspace({ accept }: { accept: string }) {
  const [file, setFile] = useState<{ name: string; bytes: Uint8Array; pages: number } | null>(null);
  const [scale, setScale] = useState(1.5);
  const [format, setFormat] = useState<"jpeg" | "png">("jpeg");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

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
      const images = await pdfPagesToImages(file.bytes, {
        scale,
        format,
        quality: 0.86,
        onProgress: (done, total) => setProgress(Math.round((done / total) * 100)),
      });
      await downloadImageZip(images, slugFile(file.name, `-pages.zip`));
      toast.success(`Saved ${images.length} images.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not export images.");
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  if (!file) {
    return (
      <div className="space-y-4">
        <Dropzone
          accept={accept}
          multiple={false}
          onFiles={(files) => void open(files[0])}
          label="Drop a PDF to export as images"
        />
        <div className="flex justify-center">
          <Button type="button" variant="outline" onClick={async () => open(await buildSamplePdf())}>
            Open sample PDF
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {file.name} · {file.pages} pages
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={() => setFile(null)}>
          Start over
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Scale {scale.toFixed(1)}x</Label>
          <Slider min={1} max={2.5} step={0.1} value={[scale]} onValueChange={(v) => setScale(v[0] ?? scale)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fmt">Format</Label>
          <select
            id="fmt"
            className="h-10 w-full rounded-md border border-input bg-card px-2 text-sm"
            value={format}
            onChange={(e) => setFormat(e.target.value as "jpeg" | "png")}
          >
            <option value="jpeg">JPG</option>
            <option value="png">PNG</option>
          </select>
        </div>
      </div>
      {busy ? <Progress value={progress} /> : null}
      <Button type="button" disabled={busy} onClick={run}>
        Download zip
      </Button>
    </div>
  );
}
