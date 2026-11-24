import { PDFDocument } from "pdf-lib";
import { getPdfDoc } from "./pdfjs-client";

export type CompressPreset = "strong" | "balanced" | "keep";

export const COMPRESS_PRESETS: Record<
  CompressPreset,
  { label: string; hint: string; maxSide: number; quality: number }
> = {
  strong: { label: "Strong", hint: "Smallest file. Soft on fine type.", maxSide: 1000, quality: 0.52 },
  balanced: { label: "Balanced", hint: "Good for scans and decks.", maxSide: 1400, quality: 0.72 },
  keep: { label: "Keep quality", hint: "Mild shrink. Sharper pages.", maxSide: 2000, quality: 0.86 },
};

export async function compressPdf(
  bytes: Uint8Array,
  preset: CompressPreset,
  onProgress?: (done: number, total: number) => void,
): Promise<Uint8Array> {
  const { maxSide, quality } = COMPRESS_PRESETS[preset];
  const src = await getPdfDoc(bytes);
  const out = await PDFDocument.create();
  const total = src.numPages;

  for (let i = 1; i <= total; i++) {
    const page = await src.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(maxSide / Math.max(base.width, base.height), 2);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available in this browser.");
    await page.render({ canvasContext: ctx, viewport }).promise;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) throw new Error("Could not encode a page.");
    const imgBytes = new Uint8Array(await blob.arrayBuffer());
    const jpg = await out.embedJpg(imgBytes);
    const outPage = out.addPage([canvas.width, canvas.height]);
    outPage.drawImage(jpg, { x: 0, y: 0, width: canvas.width, height: canvas.height });
    onProgress?.(i, total);
  }

  return out.save();
}
