import { PDFDocument, degrees } from "pdf-lib";
import type { Overlay, PageRef } from "@/components/editor/types";
import { isTextOverlay } from "@/components/editor/types";
import { canvasFont, letterSpacingPx } from "./font-match";
import { loadPdf } from "./io";
import { renderPage } from "./pdfjs-client";

const FLATTEN_SCALE = 2;

export async function exportEditedPdf(
  pages: PageRef[],
  overlays: Record<string, Overlay[]>,
): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  const srcCache = new Map<Uint8Array, PDFDocument>();

  const srcOf = async (bytes: Uint8Array) => {
    const hit = srcCache.get(bytes);
    if (hit) return hit;
    const doc = await loadPdf(bytes);
    srcCache.set(bytes, doc);
    return doc;
  };

  for (const ref of pages) {
    const marks = overlays[ref.id] ?? [];
    if (marks.length === 0 && ref.source.kind === "pdf") {
      const src = await srcOf(ref.source.bytes);
      const [copied] = await out.copyPages(src, [ref.source.index]);
      if (ref.rotation) {
        const current = copied.getRotation().angle || 0;
        copied.setRotation(degrees((current + ref.rotation) % 360));
      }
      out.addPage(copied);
      continue;
    }

    const canvas = document.createElement("canvas");
    if (ref.source.kind === "blank") {
      const w = ref.source.width * FLATTEN_SCALE;
      const h = ref.source.height * FLATTEN_SCALE;
      canvas.width = Math.max(1, Math.floor(ref.rotation % 180 === 0 ? w : h));
      canvas.height = Math.max(1, Math.floor(ref.rotation % 180 === 0 ? h : w));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is not available.");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawOverlays(ctx, marks, canvas.width, canvas.height);
    } else {
      await renderPage({
        bytes: ref.source.bytes,
        pageIndex: ref.source.index,
        canvas,
        scale: FLATTEN_SCALE,
        rotation: ref.rotation,
        dpr: 1,
      });
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is not available.");
      drawOverlays(ctx, marks, canvas.width, canvas.height);
    }

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 0.92));
    if (!blob) throw new Error("Could not flatten a page.");
    const imgBytes = new Uint8Array(await blob.arrayBuffer());
    const png = await out.embedPng(imgBytes);
    const page = out.addPage([canvas.width, canvas.height]);
    page.drawImage(png, { x: 0, y: 0, width: canvas.width, height: canvas.height });
  }

  return out.save();
}

function drawOverlays(ctx: CanvasRenderingContext2D, marks: Overlay[], w: number, h: number) {
  for (const mark of marks) {
    if (mark.type === "native-text" && mark.edited) {
      const cx = (mark.coverNx ?? mark.nx) * w;
      const cy = (mark.coverNy ?? mark.ny) * h;
      const cw = (mark.coverNw ?? mark.nw) * w;
      const ch = (mark.coverNh ?? mark.nh) * h;
      ctx.fillStyle = mark.coverColor ?? "#ffffff";
      ctx.fillRect(cx - 0.5, cy - 0.5, cw + 1, ch + 1);
    }
  }

  for (const mark of marks) {
    if (mark.type === "path") {
      if (mark.points.length < 2) continue;
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = mark.color;
      ctx.lineWidth = mark.strokeN * w;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(mark.points[0].nx * w, mark.points[0].ny * h);
      for (let i = 1; i < mark.points.length; i++) {
        ctx.lineTo(mark.points[i].nx * w, mark.points[i].ny * h);
      }
      ctx.stroke();
      ctx.restore();
      continue;
    }

    const x = mark.nx * w;
    const y = mark.ny * h;
    const width = mark.nw * w;
    const height = mark.nh * h;

    if (mark.type === "highlight" || mark.type === "rect") {
      ctx.save();
      ctx.globalAlpha = mark.opacity;
      ctx.fillStyle = mark.color;
      ctx.fillRect(x, y, width, height);
      if (mark.type === "rect") {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = mark.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
      }
      ctx.restore();
    } else if (isTextOverlay(mark)) {
      if (mark.type === "native-text" && !mark.edited) continue;
      if (!mark.text.trim() && mark.type === "native-text") continue;
      ctx.save();
      ctx.fillStyle = mark.color;
      const size = Math.max(5, mark.fontN * h);
      const baseline = (mark.baselineN ?? mark.ny + (size * 0.8) / h) * h;
      ctx.font = canvasFont(
        size,
        mark.font,
        mark.bold,
        !!mark.italic,
        mark.cssFamily,
        mark.embeddedFamily,
        mark.weight,
      );
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
      const text = mark.text.replace(/\n/g, " ");
      const isNative = mark.type === "native-text" && mark.originalNw !== undefined;
      const target = isNative ? mark.originalNw! * w : 0;
      const measured = ctx.measureText(text).width;
      const spacing = isNative && target > 0 ? letterSpacingPx(measured, target, text.length, size) : 0;
      if ("letterSpacing" in ctx) {
        (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${spacing}px`;
        ctx.fillText(text, x, baseline);
      } else {
        fillSpaced(ctx, text, x, baseline, spacing);
      }
      if (mark.underline) {
        ctx.strokeStyle = mark.color;
        ctx.lineWidth = Math.max(1, size * 0.06);
        ctx.beginPath();
        ctx.moveTo(x, baseline + size * 0.12);
        ctx.lineTo(x + Math.max(target, measured), baseline + size * 0.12);
        ctx.stroke();
      }
      ctx.restore();
    } else if (mark.type === "image" || mark.type === "signature") {
      const img = imageFromUrl(mark.dataUrl);
      if (img) ctx.drawImage(img, x, y, width, height);
    }
  }
}

function fillSpaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  let cursor = x;
  for (const ch of text) {
    ctx.fillText(ch, cursor, y);
    cursor += ctx.measureText(ch).width + spacing;
  }
}

const imgCache = new Map<string, HTMLImageElement>();
function imageFromUrl(url: string) {
  return imgCache.get(url) ?? null;
}

export function preloadOverlayImages(overlays: Record<string, Overlay[]>): Promise<void> {
  const urls = new Set<string>();
  for (const list of Object.values(overlays)) {
    for (const mark of list) {
      if (mark.type === "image" || mark.type === "signature") urls.add(mark.dataUrl);
    }
  }
  return Promise.all(
    [...urls].map(
      (url) =>
        new Promise<void>((resolve) => {
          if (imgCache.has(url)) {
            resolve();
            return;
          }
          const img = new Image();
          img.onload = () => {
            imgCache.set(url, img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = url;
        }),
    ),
  ).then(() => undefined);
}

export async function ensureBlankBytes(width = 595.28, height = 841.89) {
  const { addBlankPage } = await import("./io");
  return addBlankPage(width, height);
}
