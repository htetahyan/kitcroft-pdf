import { getPdfDoc, getPdfjs } from "./pdfjs-client";
import { detectFont, type DetectedFont, type FontKind } from "./font-match";

export type TextBlock = {
  id: string;
  text: string;
  nx: number;
  ny: number;
  nw: number;
  nh: number;
  fontN: number;
  baselineN: number;
  font: FontKind;
  cssFamily: string;
  embeddedFamily?: string;
  fontLabel: string;
  bold: boolean;
  italic: boolean;
  faceBold: boolean;
  faceItalic: boolean;
  weight?: number;
  color: string;
  coverColor: string;
};

export type Glyph = {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fontH: number;
  baseline: number;
  font: FontKind;
  cssFamily: string;
  embeddedFamily?: string;
  fontLabel: string;
  bold: boolean;
  italic: boolean;
  faceBold: boolean;
  faceItalic: boolean;
  weight?: number;
};

const cache = new Map<string, TextBlock[]>();

function cacheKey(bytes: Uint8Array, pageIndex: number, rotation: number) {
  return `v5:${bytes.byteLength}:${bytes[0] ?? 0}:${bytes[bytes.length >> 1] ?? 0}:${pageIndex}:${rotation}`;
}

export async function extractTextBlocks(options: {
  bytes: Uint8Array;
  pageIndex: number;
  rotation?: number;
}): Promise<TextBlock[]> {
  const rotation = options.rotation ?? 0;
  const key = cacheKey(options.bytes, options.pageIndex, rotation);
  const hit = cache.get(key);
  if (hit) return hit;

  const pdfjs = await getPdfjs();
  const doc = await getPdfDoc(options.bytes);
  const page = await doc.getPage(options.pageIndex + 1);
  const viewport = page.getViewport({ scale: 1, rotation });
  try {
    await page.getOperatorList();
  } catch {
    /* still extract from text content */
  }
  const content = await page.getTextContent();
  const vw = Math.max(1, viewport.width);
  const vh = Math.max(1, viewport.height);

  const raw: Glyph[] = [];
  for (const item of content.items) {
    if (!("str" in item) || !item.str) continue;
    if (!item.str.trim()) continue;
    const tx = item.transform;
    const tr = pdfjs.Util.transform(viewport.transform, tx);
    const fontHeight = Math.hypot(tr[2], tr[3]);
    if (fontHeight < 0.6) continue;
    const style = content.styles[item.fontName];
    const ascentRatio = style?.ascent ? style.ascent : style?.descent ? 1 + style.descent : 0.8;
    const descentRatio = style?.descent ? Math.abs(style.descent) : Math.max(0.05, 1 - ascentRatio);
    const ascent = fontHeight * ascentRatio;
    const descent = fontHeight * descentRatio;
    const scaleX = Math.hypot(tr[0], tr[1]);
    const srcScaleX = Math.hypot(tx[0], tx[1]) || 1;
    const width = Math.max(fontHeight * 0.25, (item.width || 0) * (scaleX / srcScaleX));
    const baseline = tr[5];
    const x = tr[4];
    const y = baseline - ascent;
    const h = Math.max(fontHeight * 0.6, ascent + descent);
    if (!Number.isFinite(x) || !Number.isFinite(y) || width < 0.4) continue;
    const mapped = detectFromPdf(page, item.fontName, style?.fontFamily ?? "");
    raw.push({
      text: item.str,
      x,
      y,
      w: width,
      h,
      fontH: fontHeight,
      baseline,
      font: mapped.kind,
      cssFamily: mapped.cssFamily,
      embeddedFamily: mapped.embeddedFamily,
      fontLabel: mapped.label,
      bold: mapped.bold,
      italic: mapped.italic,
      faceBold: mapped.faceBold,
      faceItalic: mapped.faceItalic,
      weight: mapped.weight,
    });
  }

  const runs = clusterRuns(raw);
  const blocks: TextBlock[] = runs
    .map((run, index) => {
      const minX = Math.min(...run.map((p) => p.x));
      const minY = Math.min(...run.map((p) => p.y));
      const maxX = Math.max(...run.map((p) => p.x + p.w));
      const maxY = Math.max(...run.map((p) => p.y + p.h));
      const h = Math.max(1, maxY - minY);
      const w = Math.max(1, maxX - minX);
      const fontH = run.reduce((s, p) => s + p.fontH, 0) / run.length;
      const baseline = run.reduce((s, p) => s + p.baseline, 0) / run.length;
      const vote = voteFont(run);
      return {
        id: `native-${options.pageIndex}-${index}`,
        text: joinRun(run),
        nx: clamp01(minX / vw),
        ny: clamp01(minY / vh),
        nw: clamp01(w / vw),
        nh: clamp01(h / vh),
        fontN: fontH / vh,
        baselineN: clamp01(baseline / vh),
        font: vote.font,
        cssFamily: vote.cssFamily,
        embeddedFamily: vote.embeddedFamily,
        fontLabel: vote.fontLabel,
        bold: vote.bold,
        italic: vote.italic,
        faceBold: vote.faceBold,
        faceItalic: vote.faceItalic,
        weight: vote.weight,
        color: "#111111",
        coverColor: "#ffffff",
      };
    })
    .filter((b) => b.text.length > 0 && b.nw > 0.002 && b.nh > 0.0015);

  cache.set(key, blocks);
  return blocks;
}

type PdfFontObj = {
  name?: string;
  loadedName?: string;
  fallbackName?: string;
  bold?: boolean;
  black?: boolean;
  italic?: boolean;
  weight?: string | number;
  cssFontInfo?: { fontFamily?: string; fontWeight?: string | number; italic?: boolean };
};

type DetectedWithEmbed = DetectedFont & { embeddedFamily?: string };

function detectFromPdf(
  page: { commonObjs: { has?: (id: string) => boolean; get: (id: string) => unknown } },
  fontId: string,
  cssFamily: string,
): DetectedWithEmbed {
  let loaded = "";
  let real = fontId;
  let fontObjBold = false;
  let fontObjItalic = false;
  try {
    const objs = page.commonObjs;
    const ready = typeof objs.has === "function" ? objs.has(fontId) : true;
    if (ready) {
      const font = objs.get(fontId) as PdfFontObj | string | undefined;
      if (font && typeof font === "object") {
        real = font.name || font.fallbackName || fontId;
        loaded = font.loadedName || font.cssFontInfo?.fontFamily || "";
        if (font.bold || font.black) fontObjBold = true;
        if (font.italic) fontObjItalic = true;
        const fw = font.cssFontInfo?.fontWeight ?? font.weight;
        const numWeight = typeof fw === "number" ? fw : typeof fw === "string" ? parseInt(fw, 10) : undefined;
        if (numWeight && Number.isFinite(numWeight) && numWeight >= 100) {
          detected.weight = numWeight;
          if (numWeight >= 600) fontObjBold = true;
        } else if (fw === "bold" || fw === "bolder") {
          fontObjBold = true;
          detected.weight = 700;
        }
        if (font.cssFontInfo?.italic) fontObjItalic = true;
      }
    }
  } catch {
    /* font not resolved yet */
  }
  const detected = detectFont(cssFamily, real, loaded);
  if (fontObjBold) {
    detected.bold = true;
    detected.faceBold = true;
    if (!detected.weight || detected.weight < 600) detected.weight = 700;
  }
  if (fontObjItalic) {
    detected.italic = true;
    detected.faceItalic = true;
  }
  const embeddedFamily = (cssFamily || loaded || "").trim() || undefined;
  return { ...detected, embeddedFamily };
}

export function clusterRuns(items: Glyph[]): Glyph[][] {
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const runs: Glyph[][] = [];
  for (const item of sorted) {
    const mid = item.y + item.h / 2;
    let attached = false;
    for (let i = runs.length - 1; i >= 0; i--) {
      const run = runs[i];
      const last = run[run.length - 1];
      const avgH = run.reduce((s, p) => s + p.h, 0) / run.length;
      const avgMid = run.reduce((s, p) => s + p.y + p.h / 2, 0) / run.length;
      const sameLine = Math.abs(mid - avgMid) <= Math.max(0.7, Math.min(item.h, avgH) * 0.35);
      if (!sameLine) continue;
      const gap = item.x - (last.x + last.w);
      const maxGap = Math.max(1.1, avgH * 0.4);
      if (gap >= -avgH * 0.15 && gap <= maxGap) {
        run.push(item);
        attached = true;
        break;
      }
    }
    if (!attached) runs.push([item]);
  }
  return runs;
}

function voteFont(run: Glyph[]) {
  const kinds: Record<FontKind, number> = { helvetica: 0, times: 0, courier: 0 };
  let bold = 0;
  let italic = 0;
  let faceBold = 0;
  let faceItalic = 0;
  let cssFamily = run[0].cssFamily;
  let embeddedFamily = run[0].embeddedFamily;
  let fontLabel = run[0].fontLabel;
  let bestW = 0;
  for (const p of run) {
    kinds[p.font] += p.w;
    if (p.bold) bold += p.w;
    if (p.italic) italic += p.w;
    if (p.faceBold) faceBold += p.w;
    if (p.faceItalic) faceItalic += p.w;
    if (p.w >= bestW) {
      bestW = p.w;
      cssFamily = p.cssFamily;
      embeddedFamily = p.embeddedFamily;
      fontLabel = p.fontLabel;
    }
  }
  const font = (Object.entries(kinds) as [FontKind, number][]).sort((a, b) => b[1] - a[1])[0][0];
  const total = run.reduce((s, p) => s + p.w, 0) || 1;
  const isBold = bold / total >= 0.5;
  const votedWeight = run.find((p) => p.weight && p.w >= bestW)?.weight ?? (isBold ? 700 : 400);
  return {
    font,
    cssFamily,
    embeddedFamily,
    fontLabel,
    bold: isBold,
    italic: italic / total >= 0.5,
    faceBold: faceBold / total >= 0.5,
    faceItalic: faceItalic / total >= 0.5,
    weight: votedWeight,
  };
}

function joinRun(run: Glyph[]) {
  return run
    .map((p) => p.text)
    .join("")
    .replace(/[\u0000-\u0008]/g, "")
    .trim();
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}
