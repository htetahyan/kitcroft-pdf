import { type PointerEvent as ReactPointerEvent } from "react";
import { Move } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Overlay } from "./types";
import { isTextOverlay } from "./types";
import { LineEditor } from "./text-line-editor";

export function OverlayView({
  mark,
  selected,
  onSelect,
  onMoveStart,
  onResizeStart,
  onTextChange,
  pageHeight,
  pageWidth,
  enableEdit,
}: {
  mark: Overlay;
  selected: boolean;
  pageHeight: number;
  pageWidth: number;
  enableEdit: boolean;
  onSelect: () => void;
  onMoveStart: (e: ReactPointerEvent<HTMLElement>) => void;
  onResizeStart: (e: ReactPointerEvent<HTMLSpanElement>) => void;
  onTextChange: (text: string) => void;
}) {
  if (mark.type === "path") {
    const w = 1000;
    const h = 1000;
    const d = mark.points.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.nx * w} ${pt.ny * h}`).join(" ");
    return (
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <path d={d} fill="none" stroke={mark.color} strokeWidth={mark.strokeN * w} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  const isNative = mark.type === "native-text";
  const showCover = isNative && mark.edited && mark.coverNw && mark.coverNh;
  return (
    <>
      {showCover ? (
        <div
          className="pointer-events-none absolute"
          style={{
            left: `${(mark.coverNx ?? mark.nx) * 100}%`,
            top: `${(mark.coverNy ?? mark.ny) * 100}%`,
            width: `${(mark.coverNw ?? mark.nw) * 100}%`,
            height: `${(mark.coverNh ?? mark.nh) * 100}%`,
            background: mark.coverColor ?? "#ffffff",
          }}
        />
      ) : null}
      <div
        className={cn("absolute", selected && "ring-1 ring-sky-600")}
        style={{ left: `${mark.nx * 100}%`, top: `${mark.ny * 100}%`, width: `${mark.nw * 100}%`, height: `${mark.nh * 100}%`, overflow: "visible" }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onSelect();
          if (!enableEdit) onMoveStart(e);
        }}
      >
        {isTextOverlay(mark) ? (
          <LineEditor mark={mark} pageHeight={pageHeight} pageWidth={pageWidth} selected={selected} enableEdit={enableEdit} onSelect={onSelect} onMoveStart={onMoveStart} onTextChange={onTextChange} />
        ) : mark.type === "highlight" || mark.type === "rect" ? (
          <div className="h-full w-full" style={{ background: mark.color, opacity: mark.opacity, boxShadow: mark.type === "rect" ? `inset 0 0 0 2px ${mark.color}` : undefined }} />
        ) : mark.type === "image" || mark.type === "signature" ? (
          <img src={mark.dataUrl} alt="" className="h-full w-full object-contain" draggable={false} />
        ) : null}
        {selected ? (
          <>
            <button type="button" aria-label="Drag to move" onPointerDown={onMoveStart} className="absolute -left-3 top-1/2 z-10 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-sm border border-sky-700 bg-card text-sky-800 shadow-border" style={{ cursor: "grab" }}>
              <Move className="size-3.5" />
            </button>
            <span onPointerDown={onResizeStart} className="absolute -bottom-1 -right-1 z-10 size-2.5 rounded-[1px] bg-sky-700" style={{ cursor: "nwse-resize" }} />
          </>
        ) : null}
      </div>
    </>
  );
}
