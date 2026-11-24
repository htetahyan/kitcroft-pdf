import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { EditorMode } from "@/lib/tools";
import { readFileBytes, pageCount as pdfPageCount, loadPdf } from "@/lib/pdf/io";
import { buildSamplePdf } from "@/lib/pdf/sample";
import { exportEditedPdf, preloadOverlayImages } from "@/lib/pdf/export-edits";
import { downloadBytes, formatBytes, slugFile, uid } from "@/lib/utils";
import { Dropzone } from "@/components/tools/dropzone";
import { Button } from "@/components/ui/button";
import { EditorToolbar } from "./toolbar";
import { ThumbRail } from "./thumb-rail";
import { CanvasStage } from "./canvas-stage";
import { PropPanel } from "./prop-panel";
import { SignatureDialog } from "./signature-dialog";
import type { EditorTool, Overlay, PageRef } from "./types";
import { isBoxOverlay, isTextOverlay } from "./types";
import { AD_SLOTS } from "@/lib/ads";
import { AdSlot } from "@/components/layout/ad-slot";
import { SiteHeader } from "@/components/layout/site-header";

type Snapshot = { pages: PageRef[]; overlays: Record<string, Overlay[]> };

export function PdfEditor({
  mode,
  accept,
}: {
  mode: EditorMode;
  accept: string;
}) {
  const [fileName, setFileName] = useState("document.pdf");
  const [pages, setPages] = useState<PageRef[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [overlays, setOverlays] = useState<Record<string, Overlay[]>>({});
  const [tool, setTool] = useState<EditorTool>(mode === "sign" ? "signature" : "select");
  const [selectionId, setSelectionId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [busy, setBusy] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const history = useRef<Snapshot[]>([]);
  const historyIndex = useRef(-1);
  const [, bump] = useState(0);

  useEffect(() => {
    setTool(mode === "sign" ? "signature" : "select");
  }, [mode]);

  useEffect(() => {
    if (!pages.length) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [pages.length]);

  const current = pages.find((p) => p.id === currentId) ?? pages[0] ?? null;
  const currentOverlays = current ? (overlays[current.id] ?? []) : [];
  const selected = currentOverlays.find((o) => o.id === selectionId) ?? null;

  const record = useCallback((nextPages: PageRef[], nextOverlays: Record<string, Overlay[]>) => {
    const snap: Snapshot = {
      pages: nextPages.map((p) => ({ ...p, source: { ...p.source } })),
      overlays: structuredClone(nextOverlays),
    };
    history.current = history.current.slice(0, historyIndex.current + 1);
    history.current.push(snap);
    if (history.current.length > 40) history.current.shift();
    historyIndex.current = history.current.length - 1;
    bump((n) => n + 1);
  }, []);

  const applyOpen = async (file: File | { name: string; bytes: Uint8Array }) => {
    const bytes = file instanceof File ? await readFileBytes(file) : file.bytes;
    const name = file instanceof File ? file.name : file.name;
    if (bytes.byteLength > 80 * 1024 * 1024) {
      toast.message("Large file", { description: "This stays on your device and may take a minute." });
    }
    const count = await pdfPageCount(bytes);
    const nextPages: PageRef[] = Array.from({ length: count }, (_, index) => ({
      id: uid("page"),
      rotation: 0,
      source: { kind: "pdf", bytes, index },
    }));
    setFileName(name);
    setPages(nextPages);
    setCurrentId(nextPages[0]?.id ?? null);
    setOverlays({});
    setSelectionId(null);
    history.current = [{ pages: nextPages, overlays: {} }];
    historyIndex.current = 0;
    if (mode === "insert") toast.message("Insert PDF", { description: "Use Insert PDF in the page rail, or drop a file there." });
    else if (mode === "sign") toast.message("Sign", { description: "Draw a signature, then click the page to place it." });
    else toast.message("Click a line to type in place. Use the Move tool or the grip to drag.");
  };

  const onFiles = async (files: File[]) => {
    try {
      await applyOpen(files[0]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open that PDF.");
    }
  };

  const onChangeOverlays = (next: Overlay[], rec = false) => {
    if (!current) return;
    const nextMap = { ...overlays, [current.id]: next };
    setOverlays(nextMap);
    if (rec) record(pages, nextMap);
  };

  const replaceOverlay = (overlay: Overlay) => {
    const next = overlay.type === "native-text" ? { ...overlay, edited: true } : overlay;
    onChangeOverlays(
      currentOverlays.map((item) => (item.id === overlay.id ? next : item)),
      true,
    );
  };

  const undo = () => {
    if (historyIndex.current <= 0) return;
    historyIndex.current -= 1;
    const snap = history.current[historyIndex.current];
    setPages(snap.pages);
    setOverlays(snap.overlays);
    bump((n) => n + 1);
  };
  const redo = () => {
    if (historyIndex.current >= history.current.length - 1) return;
    historyIndex.current += 1;
    const snap = history.current[historyIndex.current];
    setPages(snap.pages);
    setOverlays(snap.overlays);
    bump((n) => n + 1);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = Boolean(target?.closest("input, textarea, [contenteditable='true'], [contenteditable='']"));

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d") {
        if (typing) return;
        event.preventDefault();
        duplicateSelection();
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        if (typing) return;
        if (!current || !selectionId) return;
        event.preventDefault();
        removeSelection();
        return;
      }
      if (event.key === "Escape") {
        setSelectionId(null);
        setTool("select");
        return;
      }
      if (
        !typing &&
        (event.key === "ArrowUp" || event.key === "ArrowDown" || event.key === "ArrowLeft" || event.key === "ArrowRight")
      ) {
        if (!current || !selectionId) return;
        const mark = currentOverlays.find((item) => item.id === selectionId);
        if (!mark || !isBoxOverlay(mark)) return;
        event.preventDefault();
        const step = event.shiftKey ? 0.012 : 0.002;
        const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
        const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
        nudgeOverlay(mark.id, dx, dy);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const removeSelection = () => {
    if (!current || !selectionId) return;
    const mark = currentOverlays.find((item) => item.id === selectionId);
    if (mark?.type === "native-text") {
      onChangeOverlays(
        currentOverlays.map((item) =>
          item.id === selectionId && isTextOverlay(item) ? { ...item, text: "", edited: true } : item,
        ),
        true,
      );
    } else {
      onChangeOverlays(
        currentOverlays.filter((item) => item.id !== selectionId),
        true,
      );
    }
    setSelectionId(null);
  };

  const duplicateSelection = () => {
    if (!current || !selectionId) return;
    const mark = currentOverlays.find((item) => item.id === selectionId);
    if (!mark) return;
    const offset = 0.02;
    let copy: Overlay;
    if (mark.type === "path") {
      copy = {
        ...mark,
        id: uid("mark"),
        points: mark.points.map((pt) => ({ nx: Math.min(1, pt.nx + offset), ny: Math.min(1, pt.ny + offset) })),
      };
    } else if (mark.type === "native-text") {
      copy = {
        ...mark,
        type: "text",
        id: uid("mark"),
        nx: Math.min(1 - mark.nw, mark.nx + offset),
        ny: Math.min(1 - mark.nh, mark.ny + offset),
        baselineN: (mark.baselineN ?? mark.ny) + offset,
        edited: true,
        coverNx: undefined,
        coverNy: undefined,
        coverNw: undefined,
        coverNh: undefined,
      };
    } else {
      copy = {
        ...mark,
        id: uid("mark"),
        nx: Math.min(1 - mark.nw, mark.nx + offset),
        ny: Math.min(1 - mark.nh, mark.ny + offset),
      };
    }
    onChangeOverlays([...currentOverlays, copy], true);
    setSelectionId(copy.id);
  };

  const nudgeOverlay = (id: string, dx: number, dy: number) => {
    onChangeOverlays(
      currentOverlays.map((item) => {
        if (item.id !== id) return item;
        if (item.type === "path") {
          return {
            ...item,
            points: item.points.map((pt) => ({
              nx: Math.min(1, Math.max(0, pt.nx + dx)),
              ny: Math.min(1, Math.max(0, pt.ny + dy)),
            })),
          };
        }
        const nx = Math.min(1 - item.nw, Math.max(0, item.nx + dx));
        const ny = Math.min(1 - item.nh, Math.max(0, item.ny + dy));
        if (isTextOverlay(item)) {
          return {
            ...item,
            nx,
            ny,
            baselineN: (item.baselineN ?? item.ny) + (ny - item.ny),
            edited: item.type === "native-text" ? true : item.edited,
          };
        }
        return { ...item, nx, ny };
      }),
      true,
    );
  };

  const onTool = (next: EditorTool) => {
    setTool(next);
    if (next === "image") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        const url = await fileToDataUrl(file);
        setPendingImage(url);
        toast.message("Click the page to place the image.");
      };
      input.click();
    }
    if (next === "signature") setSignOpen(true);
  };

  const insertBlank = async (afterId: string) => {
    const after = pages.find((p) => p.id === afterId);
    let width = 612;
    let height = 792;
    if (after?.source.kind === "pdf") {
      const doc = await loadPdf(after.source.bytes);
      const size = doc.getPage(after.source.index).getSize();
      width = size.width;
      height = size.height;
    } else if (after?.source.kind === "blank") {
      width = after.source.width;
      height = after.source.height;
    }
    const page: PageRef = {
      id: uid("page"),
      rotation: 0,
      source: { kind: "blank", width, height },
    };
    const index = pages.findIndex((p) => p.id === afterId);
    const next = [...pages];
    next.splice(index + 1, 0, page);
    setPages(next);
    setCurrentId(page.id);
    record(next, overlays);
  };

  const insertPdf = async (file: File, afterId: string) => {
    try {
      const bytes = await readFileBytes(file);
      const count = await pdfPageCount(bytes);
      const added: PageRef[] = Array.from({ length: count }, (_, index) => ({
        id: uid("page"),
        rotation: 0,
        source: { kind: "pdf", bytes, index },
      }));
      const index = pages.findIndex((p) => p.id === afterId);
      const next = [...pages];
      next.splice(index + 1, 0, ...added);
      setPages(next);
      setCurrentId(added[0]?.id ?? afterId);
      record(next, overlays);
      toast.success(`Inserted ${count} page${count === 1 ? "" : "s"}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not insert that PDF.");
    }
  };

  const rotatePage = (id: string) => {
    const next = pages.map((p) =>
      p.id === id ? { ...p, rotation: ((p.rotation + 90) % 360) as PageRef["rotation"] } : p,
    );
    setPages(next);
    record(next, overlays);
  };

  const deletePage = (id: string) => {
    if (pages.length === 1) return;
    const index = pages.findIndex((p) => p.id === id);
    const next = pages.filter((p) => p.id !== id);
    setPages(next);
    const fallback = next[Math.max(0, index - 1)]?.id ?? next[0]?.id ?? null;
    setCurrentId(fallback);
    record(next, overlays);
  };

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const next = [...pages];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setPages(next);
    record(next, overlays);
  };

  const download = async () => {
    if (!pages.length) return;
    setBusy(true);
    try {
      await preloadOverlayImages(overlays);
      const bytes = await exportEditedPdf(pages, overlays);
      downloadBytes(bytes, slugFile(fileName, "-edited.pdf"));
      toast.success("Downloaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not export this PDF.");
    } finally {
      setBusy(false);
    }
  };

  const bytesLabel = useMemo(() => {
    const seen = new Set<Uint8Array>();
    let total = 0;
    for (const page of pages) {
      if (page.source.kind === "pdf" && !seen.has(page.source.bytes)) {
        seen.add(page.source.bytes);
        total += page.source.bytes.byteLength;
      }
    }
    return total ? formatBytes(total) : null;
  }, [pages]);

  if (!pages.length) {
    return (
      <div className="space-y-4">
        <Dropzone
          accept={accept}
          multiple={false}
          onFiles={onFiles}
          label={mode === "sign" ? "Drop a PDF to sign" : mode === "insert" ? "Drop the base PDF" : "Drop a PDF to edit"}
          hint="The file stays in this tab. No upload, no task meter."
        />
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              const sample = await buildSamplePdf();
              await applyOpen(sample);
            }}
          >
            Open sample PDF
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <SiteHeader dense />
      <div className="flex justify-center border-b border-rule bg-muted/30 px-3 py-1.5">
        <AdSlot slot={AD_SLOTS.editorTop} className="min-h-12" />
      </div>
      <div className="flex items-center justify-between gap-3 border-b border-rule px-3 py-2 text-sm">
        <div className="min-w-0">
          <p className="truncate font-medium">{fileName}</p>
          <p className="text-xs text-muted-foreground">
            {pages.length} page{pages.length === 1 ? "" : "s"}
            {bytesLabel ? ` · ${bytesLabel}` : ""} · click to type · grip or Move tool to drag
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => { setPages([]); setOverlays({}); }}>
          Close
        </Button>
      </div>
      <EditorToolbar
        tool={tool}
        onTool={onTool}
        onUndo={undo}
        onRedo={redo}
        canUndo={historyIndex.current > 0}
        canRedo={historyIndex.current < history.current.length - 1}
        onDownload={download}
        busy={busy}
      />
      <div className="editor-grid min-h-0 flex-1">
        <ThumbRail
          pages={pages}
          currentId={current?.id ?? null}
          onSelect={(id) => {
            setCurrentId(id);
            setSelectionId(null);
          }}
          onRotate={rotatePage}
          onDelete={deletePage}
          onInsertBlank={insertBlank}
          onInsertPdf={insertPdf}
          onReorder={reorder}
        />
        {current ? (
          <CanvasStage
            page={current}
            overlays={currentOverlays}
            tool={tool}
            zoom={zoom}
            selectionId={selectionId}
            pendingImage={pendingImage}
            onSelect={setSelectionId}
            onChangeOverlays={onChangeOverlays}
            onPlaceImage={() => setPendingImage(null)}
            onRequestSignature={() => setSignOpen(true)}
          />
        ) : (
          <div />
        )}
        <PropPanel
          overlay={selected}
          zoom={zoom}
          onZoom={setZoom}
          onChange={replaceOverlay}
          onDelete={removeSelection}
        />
      </div>
      <SignatureDialog
        open={signOpen}
        onOpenChange={setSignOpen}
        onSave={(dataUrl) => {
          setPendingImage(dataUrl);
          setTool("signature");
          toast.message("Click the page to place the signature.");
        }}
      />
    </div>
  );
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(file);
  });
}
