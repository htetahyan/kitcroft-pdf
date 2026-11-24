import { useEffect, useRef } from "react";
import { renderPage } from "@/lib/pdf/pdfjs-client";
import { cn } from "@/lib/utils";

export function PageThumb({
  bytes,
  pageIndex,
  rotation = 0,
  selected = false,
  dimmed = false,
  label,
  className,
  onClick,
}: {
  bytes: Uint8Array;
  pageIndex: number;
  rotation?: number;
  selected?: boolean;
  dimmed?: boolean;
  label?: string;
  className?: string;
  onClick?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    (async () => {
      try {
        await renderPage({
          bytes,
          pageIndex,
          canvas,
          scale: 0.22,
          rotation,
          dpr: Math.min(window.devicePixelRatio || 1, 2),
        });
      } catch {
        if (!cancelled && canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            canvas.width = 120;
            canvas.height = 160;
            ctx.fillStyle = "#fbfaf7";
            ctx.fillRect(0, 0, 120, 160);
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bytes, pageIndex, rotation]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "page-thumb relative block w-[108px] text-left transition-[box-shadow,opacity] duration-150",
        selected && "ring-2 ring-primary",
        dimmed && "opacity-40",
        className,
      )}
    >
      <canvas ref={canvasRef} className="block h-auto w-full" />
      {label ? (
        <span className="absolute inset-x-0 bottom-0 truncate bg-foreground/70 px-1 py-0.5 text-[10px] text-background">
          {label}
        </span>
      ) : null}
    </button>
  );
}
