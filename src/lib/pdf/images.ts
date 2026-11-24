import JSZip from "jszip";
import { getPdfDoc } from "./pdfjs-client";
import { downloadBlob } from "@/lib/utils";

export async function pdfPagesToImages(
  bytes: Uint8Array,
  options: {
    scale: number;
    format: "jpeg" | "png";
    quality: number;
    onProgress?: (done: number, total: number) => void;
  },
): Promise<{ name: string; blob: Blob }[]> {
  const doc = await getPdfDoc(bytes);
  const out: { name: string; blob: Blob }[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: options.scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available.");
    await page.render({ canvasContext: ctx, viewport }).promise;
    const mime = options.format === "png" ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, mime, options.quality),
    );
    if (!blob) throw new Error("Could not encode a page image.");
    const n = String(i).padStart(2, "0");
    out.push({ name: `page-${n}.${options.format === "png" ? "png" : "jpg"}`, blob });
    options.onProgress?.(i, doc.numPages);
  }
  return out;
}

export async function downloadImageZip(files: { name: string; blob: Blob }[], zipName: string) {
  const zip = new JSZip();
  for (const file of files) zip.file(file.name, file.blob);
  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, zipName);
}

export async function downloadPdfZip(files: { name: string; bytes: Uint8Array }[], zipName: string) {
  const zip = new JSZip();
  for (const file of files) {
    const copy = new Uint8Array(file.bytes.byteLength);
    copy.set(file.bytes);
    zip.file(file.name, copy);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, zipName);
}
