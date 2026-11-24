import { PDFDocument, degrees, rgb, StandardFonts } from "pdf-lib";
import { hexToRgb } from "@/lib/utils";

export async function readFileBytes(file: File): Promise<Uint8Array> {
  const buf = await file.arrayBuffer();
  return new Uint8Array(buf);
}

export async function loadPdf(bytes: Uint8Array): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(bytes);
  } catch {
    throw new Error("Could not open this PDF. It may be password-protected or damaged.");
  }
}

export async function pageCount(bytes: Uint8Array): Promise<number> {
  const doc = await loadPdf(bytes);
  return doc.getPageCount();
}

export type SourcePage = {
  bytes: Uint8Array;
  index: number;
  rotation: number;
};

export async function assemblePdf(pages: SourcePage[]): Promise<Uint8Array> {
  if (pages.length === 0) throw new Error("No pages to save.");
  const out = await PDFDocument.create();
  const cache = new Map<Uint8Array, PDFDocument>();

  const srcOf = async (bytes: Uint8Array) => {
    const hit = cache.get(bytes);
    if (hit) return hit;
    const doc = await loadPdf(bytes);
    cache.set(bytes, doc);
    return doc;
  };

  for (const page of pages) {
    const src = await srcOf(page.bytes);
    const [copied] = await out.copyPages(src, [page.index]);
    if (page.rotation) {
      const current = copied.getRotation().angle;
      copied.setRotation(degrees((current + page.rotation) % 360));
    }
    out.addPage(copied);
  }

  return out.save();
}

export async function addBlankPage(
  width = 595.28,
  height = 841.89,
): Promise<{ bytes: Uint8Array; index: number }> {
  const doc = await PDFDocument.create();
  doc.addPage([width, height]);
  return { bytes: await doc.save(), index: 0 };
}

export function pdfRgb(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return rgb(r / 255, g / 255, b / 255);
}

export { StandardFonts, degrees, rgb };
