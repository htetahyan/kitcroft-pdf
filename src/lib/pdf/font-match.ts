export type FontKind = "helvetica" | "times" | "courier";

export type DetectedFont = {
  kind: FontKind;
  cssFamily: string;
  label: string;
  bold: boolean;
  italic: boolean;
  faceBold: boolean;
  faceItalic: boolean;
  weight?: number;
};

/** Strip subset tags like "ABCDEF+" and normalize PDF font ids. */
export function cleanFontName(raw: string): string {
  return raw
    .replace(/\b[A-Z]{6}\+/gi, "")
    .replace(/^g_d\d+_f\d+$/i, "")
    .replace(/[,_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function quoteFamily(name: string): string {
  const trimmed = name.trim().replace(/^["']|["']$/g, "");
  if (!trimmed) return "";
  if (/^(sans-serif|serif|monospace|cursive|fantasy|system-ui)$/i.test(trimmed)) return trimmed;
  return `"${trimmed.replace(/"/g, '\\"')}"`;
}

export function detectFont(fontFamily: string, fontName = "", loadedName = ""): DetectedFont {
  const raw = `${fontFamily} ${fontName} ${loadedName}`;
  const cleaned = cleanFontName(raw);
  const s = cleaned.toLowerCase().replace(/psmt|mt$|ps-/g, " ");

  const faceItalic = /italic|oblique|obli|\bital\b|\bit\b|\bita\b|[\-_]it(al)?\b|\bslanted\b/.test(s);

  let weight = 400;
  if (/black|heavy|ultra|fw9/.test(s)) {
    weight = 900;
  } else if (/extrabold|fw8/.test(s)) {
    weight = 800;
  } else if (/semibold|demibold|fw6/.test(s)) {
    weight = 600;
  } else if (/bold|\bbld\b|\bbd\b|[\-_]b(ld|d)?\b|\b[a-z]+bd\b|fw7/.test(s)) {
    weight = 700;
  } else if (/medium|fw5/.test(s)) {
    weight = 500;
  } else if (/light|fw3/.test(s)) {
    weight = 300;
  } else if (/thin|hairline|fw[12]/.test(s)) {
    weight = 200;
  }

  const faceBold = weight >= 600;
  const italic = faceItalic;
  const bold = faceBold;

  const pack = (kind: FontKind, cssFamily: string, labelBase: string): DetectedFont => ({
    kind,
    cssFamily,
    label: labelOf(labelBase, bold, italic),
    bold,
    italic,
    faceBold,
    faceItalic,
    weight,
  });

  if (/courier|mono|console|lucidaconsole|menlo|monaco|inconsolata|sourcecode/.test(s)) {
    return pack("courier", '"Courier New", Courier, ui-monospace, monospace', /menlo/.test(s) ? "Menlo" : "Courier");
  }

  if (
    (/times|timesnewroman|georgia|garamond|palatino|cambria|minion|bookman|constantia|liberation serif|nimbus roman|serif/.test(s) &&
      !/sans/.test(s)) ||
    /times-roman|times-bold|times-italic/.test(s)
  ) {
    if (/georgia/.test(s)) return pack("times", "Georgia, 'Times New Roman', serif", "Georgia");
    if (/garamond/.test(s)) return pack("times", "Garamond, 'Palatino Linotype', 'Times New Roman', serif", "Garamond");
    if (/palatino/.test(s)) return pack("times", "'Palatino Linotype', Palatino, 'Times New Roman', serif", "Palatino");
    if (/cambria/.test(s)) return pack("times", "Cambria, Georgia, 'Times New Roman', serif", "Cambria");
    return pack("times", '"Times New Roman", Times, serif', "Times");
  }

  if (/calibri|carlito/.test(s)) return pack("helvetica", "Calibri, Carlito, 'Segoe UI', Arial, sans-serif", "Calibri");
  if (/verdana/.test(s)) return pack("helvetica", "Verdana, Geneva, sans-serif", "Verdana");
  if (/tahoma/.test(s)) return pack("helvetica", "Tahoma, Geneva, sans-serif", "Tahoma");
  if (/trebuchet/.test(s)) return pack("helvetica", '"Trebuchet MS", Tahoma, sans-serif', "Trebuchet");
  if (/comic/.test(s)) return pack("helvetica", '"Comic Sans MS", "Comic Sans", cursive', "Comic Sans");
  if (/impact/.test(s)) return pack("helvetica", "Impact, Haettenschweiler, sans-serif", "Impact");
  if (/arial/.test(s)) return pack("helvetica", "Arial, Helvetica, sans-serif", "Arial");
  if (/helvetica ?neue|neuehelvetica/.test(s)) return pack("helvetica", '"Helvetica Neue", Helvetica, Arial, sans-serif', "Helvetica Neue");
  if (/frutiger|myriad|univers|gill ?sans|futura|din |din-|\bfutura\b|optima|avantgarde|avant garde/.test(s)) {
    return pack("helvetica", "Arial, Helvetica, 'Segoe UI', sans-serif", cleaned.split(" ")[0] || "Sans");
  }
  if (/century gothic/.test(s)) return pack("helvetica", '"Century Gothic", AppleGothic, sans-serif', "Century Gothic");
  if (/franklin gothic/.test(s)) return pack("helvetica", '"Franklin Gothic Medium", Arial, sans-serif', "Franklin Gothic");
  if (/inter/.test(s)) return pack("helvetica", "Inter, Arial, sans-serif", "Inter");
  if (/roboto/.test(s)) return pack("helvetica", "Roboto, Arial, sans-serif", "Roboto");
  if (/opensans|open sans/.test(s)) return pack("helvetica", "'Open Sans', Arial, sans-serif", "Open Sans");
  if (/noto/.test(s)) return pack("helvetica", "'Noto Sans', Arial, sans-serif", "Noto Sans");
  if (/segoe/.test(s)) return pack("helvetica", "'Segoe UI', Calibri, Arial, sans-serif", "Segoe UI");
  if (/liberation sans|nimbus sans|dejavu sans|freesans/.test(s)) {
    return pack("helvetica", "Arial, Helvetica, sans-serif", "Sans");
  }

  const pretty = cleaned.replace(/[-_]/g, " ").replace(/\b(bold|italic|oblique|regular|medium|light)\b/gi, "").trim();
  return pack("helvetica", "Helvetica, Arial, sans-serif", pretty || "Helvetica");
}

function labelOf(base: string, bold: boolean, italic: boolean) {
  if (bold && italic) return `${base} Bold Italic`;
  if (bold) return `${base} Bold`;
  if (italic) return `${base} Italic`;
  return base;
}

export function fontStack(kind: FontKind, cssFamily?: string, embeddedFamily?: string): string {
  const fallback = cssFamily || (kind === "times" ? '"Times New Roman", Times, serif' : kind === "courier" ? '"Courier New", Courier, monospace' : "Helvetica, Arial, sans-serif");
  const embedded = embeddedFamily?.trim();
  if (!embedded) return fallback;
  const quoted = quoteFamily(embedded);
  if (fallback.toLowerCase().includes(embedded.toLowerCase())) return fallback;
  return `${quoted}, ${fallback}`;
}

export function canvasFont(
  sizePx: number,
  kind: FontKind,
  bold: boolean,
  italic: boolean,
  cssFamily?: string,
  embeddedFamily?: string,
  weight?: number,
): string {
  const style = italic ? "italic " : "";
  const weightStr = weight ? `${weight} ` : (bold ? "700 " : "400 ");
  return `${style}${weightStr}${sizePx}px ${fontStack(kind, cssFamily, embeddedFamily)}`;
}

export function letterSpacingPx(
  measuredWidth: number,
  targetWidth: number,
  charCount: number,
  fontPx?: number,
): number {
  if (charCount < 2 || !Number.isFinite(measuredWidth) || measuredWidth <= 0 || targetWidth <= 0) return 0;
  const raw = (targetWidth - measuredWidth) / (charCount - 1);
  if (!Number.isFinite(raw)) return 0;
  const maxPos = fontPx ? Math.min(fontPx * 0.12, 3) : 3;
  const minNeg = fontPx ? Math.max(-fontPx * 0.08, -2) : -2;
  return Math.max(minNeg, Math.min(maxPos, raw));
}

export type SampledLooks = { color: string; coverColor: string };

/** Read ink + paper colors from the rendered page so replacements keep the original look. */
export function sampleTextLooks(
  canvas: HTMLCanvasElement,
  box: { nx: number; ny: number; nw: number; nh: number },
): SampledLooks {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { color: "#111111", coverColor: "#ffffff" };
  const x = Math.max(0, Math.floor(box.nx * canvas.width));
  const y = Math.max(0, Math.floor(box.ny * canvas.height));
  const w = Math.max(2, Math.min(canvas.width - x, Math.ceil(box.nw * canvas.width)));
  const h = Math.max(2, Math.min(canvas.height - y, Math.ceil(box.nh * canvas.height)));
  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(x, y, w, h).data;
  } catch {
    return { color: "#111111", coverColor: "#ffffff" };
  }

  // 1. Identify background / paper color using color quantization histogram.
  // In a text box, the background color is the dominant color (>65% of pixels).
  const bins = new Map<number, { count: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 20) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const binKey = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bin = bins.get(binKey);
    if (bin) {
      bin.count++;
      bin.r += r;
      bin.g += g;
      bin.b += b;
    } else {
      bins.set(binKey, { count: 1, r, g, b });
    }
  }

  let maxBgCount = 0;
  let bgBin = { count: 0, r: 255, g: 255, b: 255 };
  for (const bin of bins.values()) {
    if (bin.count > maxBgCount) {
      maxBgCount = bin.count;
      bgBin = bin;
    }
  }

  const paperR = bgBin.count > 0 ? bgBin.r / bgBin.count : 255;
  const paperG = bgBin.count > 0 ? bgBin.g / bgBin.count : 255;
  const paperB = bgBin.count > 0 ? bgBin.b / bgBin.count : 255;

  // 2. Measure Euclidean color distance from the paper background for each pixel.
  // Anti-aliased edge pixels sit midway between paper and ink.
  // The TRUE ink color is located at the maximum distance from paper (the core glyph strokes).
  let maxDist = 0;
  const dists = new Float32Array(data.length >> 2);
  let pIdx = 0;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 20) {
      pIdx++;
      continue;
    }
    const dr = data[i] - paperR;
    const dg = data[i + 1] - paperG;
    const db = data[i + 2] - paperB;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    dists[pIdx++] = dist;
    if (dist > maxDist) maxDist = dist;
  }

  // If no pixels significantly diverge from paper, there is no text/ink
  if (maxDist < 25) {
    return {
      color: "#111111",
      coverColor: rgbHex(paperR, paperG, paperB),
    };
  }

  // 3. Sample core ink pixels: only those within 70% of max distance from paper.
  // This completely excludes anti-aliased transition pixels that are blended with the background!
  const inkThreshold = maxDist * 0.7;
  let inkR = 0;
  let inkG = 0;
  let inkB = 0;
  let inkCount = 0;
  pIdx = 0;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 20) {
      pIdx++;
      continue;
    }
    if (dists[pIdx++] >= inkThreshold) {
      inkR += data[i];
      inkG += data[i + 1];
      inkB += data[i + 2];
      inkCount++;
    }
  }

  let finalR = inkCount > 0 ? inkR / inkCount : 17;
  let finalG = inkCount > 0 ? inkG / inkCount : 17;
  let finalB = inkCount > 0 ? inkB / inkCount : 17;

  // If core ink is near-black (e.g. RGB < 38 on light paper), snap to crisp black (#111111)
  const isLightPaper = (0.2126 * paperR + 0.7152 * paperG + 0.0722 * paperB) > 128;
  if (isLightPaper && finalR < 38 && finalG < 38 && finalB < 38) {
    finalR = 17;
    finalG = 17;
    finalB = 17;
  }

  return {
    color: rgbHex(finalR, finalG, finalB),
    coverColor: rgbHex(paperR, paperG, paperB),
  };
}

function rgbHex(r: number, g: number, b: number) {
  const h = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}
