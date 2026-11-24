import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { renderPage } from "@/lib/pdf/pdfjs-client";
import { extractTextBlocks, type TextBlock } from "@/lib/pdf/text-blocks";
import { sampleTextLooks } from "@/lib/pdf/font-match";
import { cn, uid } from "@/lib/utils";
import type { EditorTool, Overlay, PageRef, TextOverlay } from "./types";
import { isBoxOverlay, isTextOverlay } from "./types";
import { OverlayView } from "./text-layer";
import { fitTextNw } from "./text-line-editor";

type Drag =
  | { kind: "new-box"; tool: "highlight" | "rect"; x0: number; y0: number }
  | { kind: "move"; id: string; dx: number; dy: number }
  | { kind: "resize"; id: string }
  | { kind: "path"; id: string };

export function CanvasStage(props: {
  page: PageRef;
  overlays: Overlay[];
  tool: EditorTool;
  zoom: number;
  selectionId: string | null;
  pendingImage: string | null;
  onSelect: (id: string | null) => void;
  onChangeOverlays: (next: Overlay[], record?: boolean) => void;
  onPlaceImage: () => void;
  onRequestSignature: () => void;
}) {
  const { page, overlays, tool, zoom, selectionId, pendingImage, onSelect, onChangeOverlays, onPlaceImage, onRequestSignature } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 400, h: 560 });
  const drag = useRef<Drag | null>(null);
  const moved = useRef(false);
  const origin = useRef({ x: 0, y: 0 });
  const [draft, setDraft] = useState<{ nx: number; ny: number; nw: number; nh: number } | null>(null);
  const [native, setNative] = useState<TextBlock[]>([]);
  const [hoverNative, setHoverNative] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    (async () => {
      try {
        if (page.source.kind === "blank") {
          const scale = zoom;
          const rot = page.rotation % 180 === 0;
          const w = (rot ? page.source.width : page.source.height) * scale;
          const h = (rot ? page.source.height : page.source.width) * scale;
          canvas.width = Math.floor(w);
          canvas.height = Math.floor(h);
          canvas.style.width = `${Math.floor(w)}px`;
          canvas.style.height = `${Math.floor(h)}px`;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          if (!cancelled) {
            setSize({ w: Math.floor(w), h: Math.floor(h) });
            setNative([]);
          }
          return;
        }
        const { viewport } = await renderPage({
          bytes: page.source.bytes,
          pageIndex: page.source.index,
          canvas,
          scale: zoom,
          rotation: page.rotation,
          dpr: Math.min(window.devicePixelRatio || 1, 2),
        });
        const blocks = await extractTextBlocks({
          bytes: page.source.bytes,
          pageIndex: page.source.index,
          rotation: page.rotation,
        });
        const painted = blocks.map((block) => {
          const looks = sampleTextLooks(canvas, block);
          return { ...block, color: looks.color, coverColor: looks.coverColor };
        });
        if (!cancelled) {
          setSize({ w: Math.floor(viewport.width), h: Math.floor(viewport.height) });
          setNative(painted);
        }
      } catch {
        /* keep previous */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, zoom]);

  const coveredIds = new Set(overlays.filter((m): m is TextOverlay => m.type === "native-text").map((m) => m.id));
  const visibleNative = native.filter((b) => !coveredIds.has(b.id));

  const norm = (event: ReactPointerEvent) => {
    const rect = stageRef.current!.getBoundingClientRect();
    return {
      nx: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      ny: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
  };

  const hitOverlay = (nx: number, ny: number) => {
    for (let i = overlays.length - 1; i >= 0; i--) {
      const mark = overlays[i];
      if (!isBoxOverlay(mark)) continue;
      if (nx >= mark.nx && nx <= mark.nx + mark.nw && ny >= mark.ny && ny <= mark.ny + mark.nh) return mark;
    }
    return null;
  };

  const hitNative = (nx: number, ny: number) => {
    for (let i = visibleNative.length - 1; i >= 0; i--) {
      const block = visibleNative[i];
      if (nx >= block.nx && nx <= block.nx + block.nw && ny >= block.ny && ny <= block.ny + block.nh) return block;
    }
    return null;
  };

  const promoteNative = (block: TextBlock): TextOverlay => ({
    type: "native-text",
    id: block.id,
    nx: block.nx,
    ny: block.ny,
    nw: block.nw,
    nh: block.nh,
    text: block.text,
    fontN: block.fontN,
    color: block.color,
    font: block.font,
    cssFamily: block.cssFamily,
    embeddedFamily: block.embeddedFamily,
    fontLabel: block.fontLabel,
    bold: block.bold,
    italic: block.italic,
    weight: block.weight,
    faceBold: block.faceBold,
    faceItalic: block.faceItalic,
    originalText: block.text,
    originalNw: block.nw,
    coverNx: block.nx,
    coverNy: block.ny,
    coverNw: block.nw,
    coverNh: block.nh,
    coverColor: block.coverColor,
    baselineN: block.baselineN,
    edited: false,
  });

  const startMove = (id: string, nx: number, ny: number, box: { nx: number; ny: number }, clientX: number, clientY: number) => {
    moved.current = false;
    origin.current = { x: clientX, y: clientY };
    drag.current = { kind: "move", id, dx: nx - box.nx, dy: ny - box.ny };
  };

  const beginMoveFromEvent = (event: ReactPointerEvent, mark: { id: string; nx: number; ny: number }) => {
    const p = norm(event);
    startMove(mark.id, p.nx, p.ny, mark, event.clientX, event.clientY);
    try {
      stageRef.current?.setPointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const p = norm(event);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* tests / untrusted */
    }
    if (tool === "signature" && !pendingImage) {
      onRequestSignature();
      return;
    }
    if ((tool === "image" || tool === "signature") && pendingImage) {
      const nw = tool === "signature" ? 0.28 : 0.32;
      const nh = tool === "signature" ? 0.1 : 0.22;
      const mark: Overlay = {
        type: tool === "signature" ? "signature" : "image",
        id: uid("mark"),
        nx: p.nx - nw / 2,
        ny: p.ny - nh / 2,
        nw,
        nh,
        dataUrl: pendingImage,
      };
      onChangeOverlays([...overlays, mark], true);
      onSelect(mark.id);
      onPlaceImage();
      return;
    }
    if (tool === "highlight" || tool === "rect") {
      drag.current = { kind: "new-box", tool, x0: p.nx, y0: p.ny };
      setDraft({ nx: p.nx, ny: p.ny, nw: 0, nh: 0 });
      return;
    }
    if (tool === "draw") {
      const id = uid("mark");
      drag.current = { kind: "path", id };
      onChangeOverlays([...overlays, { type: "path", id, points: [p], color: "#1e4a45", strokeN: 0.006 }], true);
      return;
    }
    const overlayHit = hitOverlay(p.nx, p.ny);
    if (overlayHit && isBoxOverlay(overlayHit)) {
      onSelect(overlayHit.id);
      if (tool === "move") startMove(overlayHit.id, p.nx, p.ny, overlayHit, event.clientX, event.clientY);
      return;
    }
    if (tool === "select" || tool === "text" || tool === "move") {
      const block = hitNative(p.nx, p.ny);
      if (block) {
        const mark = promoteNative(block);
        onChangeOverlays([...overlays, mark], true);
        onSelect(mark.id);
        if (tool === "move") startMove(mark.id, p.nx, p.ny, mark, event.clientX, event.clientY);
        return;
      }
    }
    if (tool === "text") {
      const fontN = 0.028;
      const mark: Overlay = {
        type: "text",
        id: uid("mark"),
        nx: p.nx,
        ny: p.ny,
        nw: 0.42,
        nh: 0.05,
        text: "Type here",
        fontN,
        color: "#1a1916",
        font: "helvetica",
        bold: false,
        baselineN: p.ny + fontN * 0.8,
        edited: true,
      };
      onChangeOverlays([...overlays, mark], true);
      onSelect(mark.id);
      return;
    }
    onSelect(null);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const p = norm(event);
    if (!drag.current && (tool === "select" || tool === "text" || tool === "move")) {
      setHoverNative(hitNative(p.nx, p.ny)?.id ?? null);
    }
    const current = drag.current;
    if (!current) return;
    if (current.kind === "move") {
      const dist = Math.hypot(event.clientX - origin.current.x, event.clientY - origin.current.y);
      if (!moved.current && dist < 3) return;
      moved.current = true;
      onChangeOverlays(
        overlays.map((mark) => {
          if (mark.id !== current.id || !isBoxOverlay(mark)) return mark;
          const nx = Math.min(1 - mark.nw, Math.max(0, p.nx - current.dx));
          const ny = Math.min(1 - mark.nh, Math.max(0, p.ny - current.dy));
          const dy = ny - mark.ny;
          if (isTextOverlay(mark)) {
            return {
              ...mark,
              nx,
              ny,
              baselineN: (mark.baselineN ?? mark.ny + mark.fontN * 0.8) + dy,
              edited: mark.type === "native-text" ? true : mark.edited,
            };
          }
          return { ...mark, nx, ny };
        }),
      );
      return;
    }
    if (current.kind === "new-box") {
      const nx = Math.min(current.x0, p.nx);
      const ny = Math.min(current.y0, p.ny);
      setDraft({ nx, ny, nw: Math.abs(p.nx - current.x0), nh: Math.abs(p.ny - current.y0) });
    } else if (current.kind === "resize") {
      moved.current = true;
      onChangeOverlays(
        overlays.map((mark) =>
          mark.id === current.id && isBoxOverlay(mark)
            ? {
                ...mark,
                nw: Math.min(1 - mark.nx, Math.max(0.01, p.nx - mark.nx)),
                nh: Math.min(1 - mark.ny, Math.max(0.008, p.ny - mark.ny)),
                ...(mark.type === "native-text" ? { edited: true } : {}),
              }
            : mark,
        ),
      );
    } else if (current.kind === "path") {
      onChangeOverlays(
        overlays.map((mark) => (mark.id === current.id && mark.type === "path" ? { ...mark, points: [...mark.points, p] } : mark)),
      );
    }
  };

  const onPointerUp = () => {
    const current = drag.current;
    drag.current = null;
    if (current?.kind === "new-box" && draft && draft.nw > 0.01 && draft.nh > 0.008) {
      const mark: Overlay = {
        type: current.tool,
        id: uid("mark"),
        ...draft,
        color: current.tool === "highlight" ? "#f3e08a" : "#1e4a45",
        opacity: current.tool === "highlight" ? 0.45 : 0.12,
      };
      onChangeOverlays([...overlays, mark], true);
      onSelect(mark.id);
    } else if ((current?.kind === "move" || current?.kind === "resize") && moved.current) {
      onChangeOverlays(overlays, true);
    }
    setDraft(null);
    moved.current = false;
  };

  const stageCursor = tool === "move" ? "grab" : tool === "text" || tool === "select" ? "text" : "crosshair";

  return (
    <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto bg-muted/50 p-4">
      <div
        ref={stageRef}
        className="relative shadow-sheet"
        style={{ width: size.w, height: size.h, cursor: stageCursor }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <canvas ref={canvasRef} className="block" />
        <div className="absolute inset-0">
          {visibleNative.map((block) => (
            <div
              key={block.id}
              className={cn("pointer-events-none absolute", hoverNative === block.id && "bg-sky-400/15 ring-1 ring-sky-600")}
              style={{ left: `${block.nx * 100}%`, top: `${block.ny * 100}%`, width: `${block.nw * 100}%`, height: `${block.nh * 100}%` }}
            />
          ))}
          {overlays.map((mark) => (
            <OverlayView
              key={mark.id}
              mark={mark}
              selected={mark.id === selectionId}
              pageHeight={size.h}
              pageWidth={size.w}
              enableEdit={tool !== "move"}
              onSelect={() => onSelect(mark.id)}
              onMoveStart={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (!isBoxOverlay(mark)) return;
                onSelect(mark.id);
                beginMoveFromEvent(e, mark);
              }}
              onResizeStart={(e) => {
                e.stopPropagation();
                if (!isBoxOverlay(mark)) return;
                drag.current = { kind: "resize", id: mark.id };
                try {
                  stageRef.current?.setPointerCapture(e.pointerId);
                } catch {
                  /* ignore */
                }
              }}
              onTextChange={(text) =>
                onChangeOverlays(
                  overlays.map((item) => {
                    if (item.id !== mark.id || !isTextOverlay(item)) return item;
                    return { ...item, text, edited: true, nw: fitTextNw(item, text, size.w, size.h) };
                  }),
                  true,
                )
              }
            />
          ))}
          {draft ? (
            <div
              className="pointer-events-none absolute bg-highlight/50"
              style={{ left: `${draft.nx * 100}%`, top: `${draft.ny * 100}%`, width: `${draft.nw * 100}%`, height: `${draft.nh * 100}%` }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
