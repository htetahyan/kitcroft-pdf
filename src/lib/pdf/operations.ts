import { PDFDocument, StandardFonts, degrees, rgb, PageSizes } from "pdf-lib";
import { loadPdf, pdfRgb, type SourcePage, assemblePdf } from "./io";
import { hexToRgb } from "@/lib/utils";

export { assemblePdf };
export type { SourcePage };

export async function imagesToPdf(
  images: { bytes: Uint8Array; type: string; name: string }[],
  pageSize: "fit" | "a4" | "letter",
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (const image of images) {
    const isPng = image.type.includes("png") || /\.png$/i.test(image.name);
    const embedded = isPng ? await doc.embedPng(image.bytes) : await doc.embedJpg(image.bytes);
    const iw = embedded.width;
    const ih = embedded.height;
    let width: number;
    let height: number;
    if (pageSize === "fit") {
      width = iw;
      height = ih;
    } else {
      const [pw, ph] = pageSize === "a4" ? PageSizes.A4 : PageSizes.Letter;
      const scale = Math.min(pw / iw, ph / ih);
      width = pw;
      height = ph;
      const page = doc.addPage([width, height]);
      page.drawImage(embedded, {
        x: (pw - iw * scale) / 2,
        y: (ph - ih * scale) / 2,
        width: iw * scale,
        height: ih * scale,
      });
      continue;
    }
    const page = doc.addPage([width, height]);
    page.drawImage(embedded, { x: 0, y: 0, width, height });
  }
  return doc.save();
}

export type WatermarkOpts = {
  text: string;
  fontSize: number;
  opacity: number;
  rotation: number;
  color: string;
  repeat: boolean;
};

export async function watermarkPdf(bytes: Uint8Array, opts: WatermarkOpts): Promise<Uint8Array> {
  const doc = await loadPdf(bytes);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const color = pdfRgb(opts.color);
  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    if (opts.repeat) {
      const stepX = Math.max(160, opts.fontSize * 8);
      const stepY = Math.max(120, opts.fontSize * 6);
      for (let y = 40; y < height; y += stepY) {
        for (let x = 24; x < width; x += stepX) {
          page.drawText(opts.text, {
            x,
            y,
            size: opts.fontSize,
            font,
            color,
            opacity: opts.opacity,
            rotate: degrees(opts.rotation),
          });
        }
      }
    } else {
      const tw = font.widthOfTextAtSize(opts.text, opts.fontSize);
      page.drawText(opts.text, {
        x: (width - tw) / 2,
        y: height / 2,
        size: opts.fontSize,
        font,
        color,
        opacity: opts.opacity,
        rotate: degrees(opts.rotation),
      });
    }
  }
  return doc.save();
}

export type NumberOpts = {
  format: "n" | "page-n" | "n-of";
  position: "bottom-center" | "bottom-right" | "bottom-left" | "top-center";
  start: number;
  fontSize: number;
  color: string;
};

export async function numberPages(bytes: Uint8Array, opts: NumberOpts): Promise<Uint8Array> {
  const doc = await loadPdf(bytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const color = pdfRgb(opts.color);
  pages.forEach((page, i) => {
    const n = opts.start + i;
    const label =
      opts.format === "page-n" ? `Page ${n}` : opts.format === "n-of" ? `${n} / ${pages.length}` : String(n);
    const { width, height } = page.getSize();
    const tw = font.widthOfTextAtSize(label, opts.fontSize);
    const inset = 28;
    let x = (width - tw) / 2;
    let y = inset;
    if (opts.position === "bottom-right") x = width - tw - inset;
    if (opts.position === "bottom-left") x = inset;
    if (opts.position === "top-center") y = height - inset - opts.fontSize;
    page.drawText(label, { x, y, size: opts.fontSize, font, color });
  });
  return doc.save();
}

export function parseHexColor(hex: string) {
  return hexToRgb(hex);
}

export { rgb };
