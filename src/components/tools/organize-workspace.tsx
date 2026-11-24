import { useMemo, useState } from "react";
import { toast } from "sonner";
import { RotateCw, Trash2 } from "lucide-react";
import type { OrganizeMode } from "@/lib/tools";
import { readFileBytes, assemblePdf, pageCount as pdfPageCount, type SourcePage } from "@/lib/pdf/io";
import { downloadPdfZip } from "@/lib/pdf/images";
import { buildSamplePdf } from "@/lib/pdf/sample";
import { downloadBytes, formatBytes, slugFile, uid } from "@/lib/utils";
import { Dropzone } from "./dropzone";
import { PageThumb } from "./page-thumb";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type BoardFile = { id: string; name: string; bytes: Uint8Array; pageCount: number };
type BoardPage = {
  id: string;
  fileId: string;
  fileName: string;
  pageIndex: number;
  rotation: number;
  included: boolean;
  splitAfter: boolean;
};

export function OrganizeWorkspace({
  mode,
  accept,
  multiple,
}: {
  mode: OrganizeMode;
  accept: string;
  multiple: boolean;
}) {
  const [files, setFiles] = useState<BoardFile[]>([]);
  const [pages, setPages] = useState<BoardPage[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const addFiles = async (incoming: File[]) => {
    try {
      const addedFiles: BoardFile[] = [];
      const addedPages: BoardPage[] = [];
      for (const file of incoming) {
        const bytes = await readFileBytes(file);
        const count = await pdfPageCount(bytes);
        const board: BoardFile = { id: uid("file"), name: file.name, bytes, pageCount: count };
        addedFiles.push(board);
        for (let i = 0; i < count; i++) {
          addedPages.push({
            id: uid("p"),
            fileId: board.id,
            fileName: file.name,
            pageIndex: i,
            rotation: 0,
            included: mode !== "extract",
            splitAfter: false,
          });
        }
      }
      setFiles((prev) => (multiple ? [...prev, ...addedFiles] : addedFiles));
      setPages((prev) => (multiple ? [...prev, ...addedPages] : addedPages));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open that PDF.");
    }
  };

  const included = pages.filter((p) => p.included);
  const totalBytes = files.reduce((sum, f) => sum + f.bytes.byteLength, 0);

  const sourcePages = (): SourcePage[] =>
    included.map((p) => {
      const file = files.find((f) => f.id === p.fileId)!;
      return { bytes: file.bytes, index: p.pageIndex, rotation: p.rotation };
    });

  const downloadMerged = async (suffix: string) => {
    if (!included.length) {
      toast.error("Select at least one page.");
      return;
    }
    setBusy(true);
    setProgress(20);
    try {
      const bytes = await assemblePdf(sourcePages());
      setProgress(100);
      downloadBytes(bytes, slugFile(files[0]?.name ?? "document", suffix));
      toast.success("Downloaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not build the PDF.");
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  const downloadSplit = async () => {
    if (!included.length) return;
    setBusy(true);
    try {
      const ranges: BoardPage[][] = [];
      let current: BoardPage[] = [];
      for (const page of included) {
        current.push(page);
        if (page.splitAfter) {
          ranges.push(current);
          current = [];
        }
      }
      if (current.length) ranges.push(current);
      const outputs: { name: string; bytes: Uint8Array }[] = [];
      for (let i = 0; i < ranges.length; i++) {
        const bytes = await assemblePdf(
          ranges[i].map((p) => {
            const file = files.find((f) => f.id === p.fileId)!;
            return { bytes: file.bytes, index: p.pageIndex, rotation: p.rotation };
          }),
        );
        outputs.push({ name: `part-${String(i + 1).padStart(2, "0")}.pdf`, bytes });
        setProgress(Math.round(((i + 1) / ranges.length) * 100));
      }
      await downloadPdfZip(outputs, slugFile(files[0]?.name ?? "document", "-split.zip"));
      toast.success(`Saved ${outputs.length} files.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not split.");
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  const headline = useMemo(() => {
    switch (mode) {
      case "merge":
        return "Drop PDFs to merge";
      case "split":
        return "Drop a PDF to split";
      case "delete":
        return "Drop a PDF to delete pages";
      case "rotate":
        return "Drop a PDF to rotate";
      case "extract":
        return "Drop a PDF to extract pages";
      default:
        return "Drop PDFs to organize";
    }
  }, [mode]);

  if (!files.length) {
    return (
      <div className="space-y-4">
        <Dropzone
          accept={accept}
          multiple={multiple}
          onFiles={addFiles}
          label={headline}
          hint="Pages are arranged on this device. Nothing is uploaded."
        />
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              const sample = await buildSamplePdf();
              const file = new File([sample.bytes as BlobPart], sample.name, { type: "application/pdf" });
              await addFiles([file]);
            }}
          >
            Open sample PDF
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {files.length} file{files.length === 1 ? "" : "s"} · {included.length}/{pages.length} pages · {formatBytes(totalBytes)}
        </p>
        <div className="flex flex-wrap gap-2">
          {mode === "extract" || mode === "delete" ? (
            <>
              <Button type="button" variant="outline" size="sm" onClick={() => setPages((p) => p.map((x) => ({ ...x, included: true })))}>
                Keep all
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setPages((p) => p.map((x) => ({ ...x, included: false })))}>
                Keep none
              </Button>
            </>
          ) : null}
          {mode === "rotate" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPages((p) => p.map((x) => ({ ...x, rotation: (x.rotation + 90) % 360 })))}
            >
              Rotate all
            </Button>
          ) : null}
          {mode === "split" ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPages((p) => p.map((x) => ({ ...x, splitAfter: true })))}
              >
                Split every page
              </Button>
              <Button type="button" disabled={busy} onClick={downloadSplit}>
                Download zip
              </Button>
            </>
          ) : (
            <Button
              type="button"
              disabled={busy}
              onClick={() =>
                downloadMerged(
                  mode === "merge"
                    ? "-merged.pdf"
                    : mode === "extract"
                      ? "-extracted.pdf"
                      : mode === "delete"
                        ? "-trimmed.pdf"
                        : mode === "rotate"
                          ? "-rotated.pdf"
                          : "-organized.pdf",
                )
              }
            >
              Download PDF
            </Button>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={() => { setFiles([]); setPages([]); }}>
            Start over
          </Button>
        </div>
      </div>
      {busy ? <Progress value={progress} /> : null}
      {multiple ? (
        <label className="inline-flex cursor-pointer text-sm text-primary underline-offset-2 hover:underline">
          Add more PDFs
          <input
            type="file"
            accept={accept}
            multiple
            className="sr-only"
            onChange={(e) => {
              if (e.target.files) void addFiles(Array.from(e.target.files));
              e.target.value = "";
            }}
          />
        </label>
      ) : null}
      <div className="flex flex-wrap gap-3">
        {pages.map((page, index) => {
          const file = files.find((f) => f.id === page.fileId);
          if (!file) return null;
          return (
            <div key={page.id} className="w-[108px]">
              <PageThumb
                bytes={file.bytes}
                pageIndex={page.pageIndex}
                rotation={page.rotation}
                dimmed={!page.included}
                selected={mode === "extract" ? page.included : false}
                label={`${index + 1} · ${page.fileName.replace(/\.pdf$/i, "")}`}
                onClick={() => {
                  if (mode === "delete" || mode === "extract" || mode === "organize" || mode === "merge") {
                    setPages((list) =>
                      list.map((item) => (item.id === page.id ? { ...item, included: !item.included } : item)),
                    );
                  }
                }}
              />
              <div className="mt-1 flex justify-center gap-0.5">
                {(mode === "rotate" || mode === "organize" || mode === "merge") && (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Rotate"
                    onClick={() =>
                      setPages((list) =>
                        list.map((item) => (item.id === page.id ? { ...item, rotation: (item.rotation + 90) % 360 } : item)),
                      )
                    }
                  >
                    <RotateCw />
                  </Button>
                )}
                {(mode === "delete" || mode === "organize") && (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Toggle page"
                    onClick={() =>
                      setPages((list) =>
                        list.map((item) => (item.id === page.id ? { ...item, included: !item.included } : item)),
                      )
                    }
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
              {mode === "split" && index < pages.length - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setPages((list) =>
                      list.map((item) => (item.id === page.id ? { ...item, splitAfter: !item.splitAfter } : item)),
                    )
                  }
                  className="mt-1 w-full rounded-sm border border-dashed border-rule py-1 text-[10px] uppercase tracking-wide text-muted-foreground hover:border-primary hover:text-foreground"
                >
                  {page.splitAfter ? "Cut here" : "Add cut"}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
      {mode === "delete" || mode === "extract" ? (
        <p className="text-xs text-muted-foreground">
          {mode === "delete" ? "Dimmed pages will be removed." : "Click pages to keep them in the new file."}
        </p>
      ) : null}
    </div>
  );
}
