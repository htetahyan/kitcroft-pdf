import { useState } from "react";
import { toast } from "sonner";
import { watermarkPdf } from "@/lib/pdf/operations";
import { readFileBytes, pageCount as pdfPageCount } from "@/lib/pdf/io";
import { buildSamplePdf } from "@/lib/pdf/sample";
import { downloadBytes, slugFile } from "@/lib/utils";
import { Dropzone } from "./dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export function WatermarkWorkspace({ accept }: { accept: string }) {
  const [file, setFile] = useState<{ name: string; bytes: Uint8Array; pages: number } | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState(28);
  const [opacity, setOpacity] = useState(0.18);
  const [rotation, setRotation] = useState(-24);
  const [repeat, setRepeat] = useState(true);
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
      const bytes = await watermarkPdf(file.bytes, {
        text: text || " ",
        fontSize,
        opacity,
        rotation,
        color: "#1a1916",
        repeat,
      });
      downloadBytes(bytes, slugFile(file.name, "-watermarked.pdf"));
      toast.success("Downloaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not watermark.");
    } finally {
      setBusy(false);
    }
  };

  if (!file) {
    return (
      <div className="space-y-4">
        <Dropzone accept={accept} multiple={false} onFiles={(f) => void open(f[0])} label="Drop a PDF to watermark" />
        <div className="flex justify-center">
          <Button type="button" variant="outline" onClick={async () => open(await buildSamplePdf())}>
            Open sample PDF
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_220px]">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {file.name} · {file.pages} pages
        </p>
        <div className="space-y-2">
          <Label htmlFor="wm">Watermark text</Label>
          <Input id="wm" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Size {fontSize}pt</Label>
          <Slider min={10} max={64} step={1} value={[fontSize]} onValueChange={(v) => setFontSize(v[0] ?? fontSize)} />
        </div>
        <div className="space-y-2">
          <Label>Opacity {Math.round(opacity * 100)}%</Label>
          <Slider min={0.06} max={0.6} step={0.02} value={[opacity]} onValueChange={(v) => setOpacity(v[0] ?? opacity)} />
        </div>
        <div className="space-y-2">
          <Label>Rotation {rotation}°</Label>
          <Slider min={-45} max={45} step={1} value={[rotation]} onValueChange={(v) => setRotation(v[0] ?? rotation)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} />
          Repeat across the page
        </label>
        <div className="flex gap-2">
          <Button type="button" disabled={busy} onClick={run}>
            Download
          </Button>
          <Button type="button" variant="ghost" onClick={() => setFile(null)}>
            Start over
          </Button>
        </div>
      </div>
      <div className="paper-sheet flex aspect-[3/4] items-center justify-center p-6">
        <p
          className="select-none text-center font-display text-lg font-medium text-foreground"
          style={{ opacity, transform: `rotate(${rotation}deg)` }}
        >
          {text || " "}
        </p>
      </div>
    </div>
  );
}
