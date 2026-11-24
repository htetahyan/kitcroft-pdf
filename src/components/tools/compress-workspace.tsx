import { useState } from "react";
import { toast } from "sonner";
import { compressPdf, COMPRESS_PRESETS, type CompressPreset } from "@/lib/pdf/compress";
import { readFileBytes, pageCount as pdfPageCount } from "@/lib/pdf/io";
import { buildSamplePdf } from "@/lib/pdf/sample";
import { downloadBytes, formatBytes, slugFile } from "@/lib/utils";
import { Dropzone } from "./dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function CompressWorkspace({ accept }: { accept: string }) {
  const [file, setFile] = useState<{ name: string; bytes: Uint8Array; pages: number } | null>(null);
  const [preset, setPreset] = useState<CompressPreset>("balanced");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ bytes: Uint8Array; size: number } | null>(null);

  const open = async (incoming: File | { name: string; bytes: Uint8Array }) => {
    try {
      const bytes = incoming instanceof File ? await readFileBytes(incoming) : incoming.bytes;
      const name = incoming instanceof File ? incoming.name : incoming.name;
      const pages = await pdfPageCount(bytes);
      setFile({ name, bytes, pages });
      setResult(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open that PDF.");
    }
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setProgress(0);
    try {
      const bytes = await compressPdf(file.bytes, preset, (done, total) =>
        setProgress(Math.round((done / total) * 100)),
      );
      setResult({ bytes, size: bytes.byteLength });
      toast.success("Compressed on this device.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not compress.");
    } finally {
      setBusy(false);
    }
  };

  if (!file) {
    return (
      <div className="space-y-4">
        <Dropzone
          accept={accept}
          multiple={false}
          onFiles={(files) => void open(files[0])}
          label="Drop a PDF to compress"
          hint="Best on scans and photo-heavy files. Lean text PDFs may not shrink."
        />
        <div className="flex justify-center">
          <Button type="button" variant="outline" onClick={async () => open(await buildSamplePdf())}>
            Open sample PDF
          </Button>
        </div>
      </div>
    );
  }

  const ratio = result ? result.size / file.bytes.byteLength : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-medium">{file.name}</p>
          <p className="text-sm text-muted-foreground">
            {file.pages} pages · original {formatBytes(file.bytes.byteLength)}
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => { setFile(null); setResult(null); }}>
          Start over
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {(Object.keys(COMPRESS_PRESETS) as CompressPreset[]).map((key) => {
          const item = COMPRESS_PRESETS[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setPreset(key);
                setResult(null);
              }}
              className={cn(
                "paper-sheet paper-sheet-hover rounded-xl p-4 text-left",
                preset === key && "ring-2 ring-primary",
              )}
            >
              <p className="font-medium">{item.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.hint}</p>
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={busy} onClick={run}>
          {busy ? "Compressing" : "Compress"}
        </Button>
        {result ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => downloadBytes(result.bytes, slugFile(file.name, "-compressed.pdf"))}
          >
            Download {formatBytes(result.size)}
          </Button>
        ) : null}
      </div>
      {busy ? <Progress value={progress} /> : null}
      {result && ratio !== null ? (
        <p className="text-sm text-muted-foreground">
          {ratio < 0.98
            ? `Now ${formatBytes(result.size)} — ${Math.round((1 - ratio) * 100)}% smaller.`
            : `Now ${formatBytes(result.size)}. This file was already lean; rasterizing did not help.`}
        </p>
      ) : null}
    </div>
  );
}
