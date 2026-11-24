import { useEffect, useLayoutEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { fontStack, letterSpacingPx } from "@/lib/pdf/font-match";
import type { TextOverlay } from "./types";

export function LineEditor({
  mark,
  pageHeight,
  pageWidth,
  selected,
  enableEdit,
  onSelect,
  onMoveStart,
  onTextChange,
}: {
  mark: TextOverlay;
  pageHeight: number;
  pageWidth: number;
  selected: boolean;
  enableEdit: boolean;
  onSelect: () => void;
  onMoveStart: (e: ReactPointerEvent<HTMLElement>) => void;
  onTextChange: (text: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fontPx = Math.max(5, mark.fontN * pageHeight);
  const family = fontStack(mark.font, mark.cssFamily, mark.embeddedFamily);
  const bold = !!mark.bold;
  const italic = !!mark.italic;
  const weight = mark.weight ?? (bold ? 700 : 400);
  const ascent = cssAscentPx(fontPx, family, bold, italic, weight);
  const baselinePx = (mark.baselineN ?? mark.ny + ascent / pageHeight) * pageHeight;
  const top = baselinePx - mark.ny * pageHeight - ascent;
  const visible = mark.type !== "native-text" || !!mark.edited;
  const isNative = mark.type === "native-text" && mark.originalNw !== undefined;
  const targetWidthPx = isNative ? mark.originalNw! * pageWidth : 0;
  const spacing = isNative && targetWidthPx > 0
    ? spacingFor(mark.originalText ?? mark.text, fontPx, family, bold, italic, targetWidthPx, weight)
    : 0;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement !== el && el.textContent !== mark.text) el.textContent = mark.text;
  }, [mark.text, mark.id]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.textContent !== mark.text) el.textContent = mark.text;
  }, [mark.id]);

  useEffect(() => {
    if (!selected || !enableEdit) return;
    const el = ref.current;
    if (!el || document.activeElement === el) return;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, [selected, enableEdit, mark.id]);

  return (
    <div
      ref={ref}
      contentEditable={selected && enableEdit}
      suppressContentEditableWarning
      spellCheck={false}
      role="textbox"
      aria-label="PDF text"
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect();
        if (!enableEdit) onMoveStart(e);
      }}
      onInput={(e) => onTextChange((e.currentTarget.textContent ?? "").replace(/\s*\n+/g, " "))}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.preventDefault();
        e.stopPropagation();
      }}
      onPaste={(e) => {
        e.preventDefault();
        document.execCommand("insertText", false, e.clipboardData.getData("text/plain").replace(/\s*\n+/g, " "));
      }}
      style={{
        position: "absolute",
        left: 0,
        top,
        fontSize: fontPx,
        lineHeight: 1,
        fontFamily: family,
        fontWeight: weight,
        fontStyle: italic ? "italic" : "normal",
        fontVariant: "normal",
        fontStretch: "normal",
        fontKerning: "none",
        letterSpacing: `${spacing}px`,
        textDecoration: mark.underline ? "underline" : "none",
        textDecorationColor: mark.color,
        color: visible ? mark.color : "transparent",
        WebkitTextFillColor: visible ? mark.color : "transparent",
        caretColor: mark.color || "#111111",
        background: "transparent",
        padding: 0,
        margin: 0,
        border: 0,
        outline: "none",
        whiteSpace: "pre",
        width: "max-content",
        minWidth: "100%",
        minHeight: fontPx,
        overflow: "visible",
        transformOrigin: "0 0",
        cursor: enableEdit ? "text" : "inherit",
        WebkitFontSmoothing: "subpixel-antialiased",
        MozOsxFontSmoothing: "auto",
        textRendering: "optimizeLegibility",
      }}
    />
  );
}

const ascentCache = new Map<string, number>();

function cssAscentPx(fontPx: number, fontFamily: string, bold: boolean, italic = false, weight?: number): number {
  const w = weight ?? (bold ? 700 : 400);
  const key = `${fontFamily}:${w}:${italic ? "i" : "r"}`;
  const cached = ascentCache.get(key);
  if (cached) return cached * fontPx;
  if (typeof document === "undefined") return fontPx * 0.8;
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return fontPx * 0.8;
    ctx.font = `${italic ? "italic " : ""}${w} 100px ${fontFamily}`;
    const metrics = ctx.measureText("Hg");
    const ratio = metrics.fontBoundingBoxAscent ? metrics.fontBoundingBoxAscent / 100 : 0.8;
    ascentCache.set(key, ratio);
    return ratio * fontPx;
  } catch {
    return fontPx * 0.8;
  }
}

function cssFont(fontPx: number, family: string, bold: boolean, italic: boolean, weight?: number) {
  const w = weight ?? (bold ? 700 : 400);
  return `${italic ? "italic " : ""}${w} ${fontPx}px ${family}`;
}

function spacingFor(
  text: string,
  fontPx: number,
  family: string,
  bold: boolean,
  italic: boolean,
  targetWidthPx: number,
  weight?: number,
): number {
  if (typeof document === "undefined" || text.length < 2 || targetWidthPx <= 0) return 0;
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return 0;
    ctx.font = cssFont(fontPx, family, bold, italic, weight);
    const measured = ctx.measureText(text).width;
    return letterSpacingPx(measured, targetWidthPx, text.length, fontPx);
  } catch {
    return 0;
  }
}

function measureTextPx(
  text: string,
  fontPx: number,
  family: string,
  bold: boolean,
  italic: boolean,
  spacing: number,
  weight?: number,
): number {
  if (typeof document === "undefined") return Math.max(1, text.length) * fontPx * 0.55;
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return Math.max(1, text.length) * fontPx * 0.55;
    ctx.font = cssFont(fontPx, family, bold, italic, weight);
    const base = ctx.measureText(text).width;
    const extra = text.length > 1 ? spacing * (text.length - 1) : 0;
    return Math.max(fontPx * 0.4, base + extra);
  } catch {
    return Math.max(1, text.length) * fontPx * 0.55;
  }
}

export function fitTextNw(mark: TextOverlay, text: string, pageWidth: number, pageHeight: number): number {
  if (pageWidth <= 0 || pageHeight <= 0) return mark.nw;
  const fontPx = Math.max(5, mark.fontN * pageHeight);
  const family = fontStack(mark.font, mark.cssFamily, mark.embeddedFamily);
  const bold = !!mark.bold;
  const italic = !!mark.italic;
  const weight = mark.weight ?? (bold ? 700 : 400);
  const original = mark.originalText ?? mark.text;
  const target = (mark.originalNw ?? mark.nw) * pageWidth;
  const spacing = spacingFor(original, fontPx, family, bold, italic, target, weight);
  const widthPx = measureTextPx(text || " ", fontPx, family, bold, italic, spacing, weight);
  const needed = (widthPx + Math.max(6, fontPx * 0.2)) / pageWidth;
  const minNw = mark.originalNw ?? mark.nw;
  return Math.min(1 - mark.nx, Math.max(minNw, needed));
}
