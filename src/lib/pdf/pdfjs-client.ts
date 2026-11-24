import type { PDFDocumentProxy, PageViewport } from "pdfjs-dist";

type Pdfjs = typeof import("pdfjs-dist");

let pdfjsMod: Pdfjs | null = null;
let configured = false;
const docs = new Map<Uint8Array, Promise<PDFDocumentProxy>>();
let renderLock: Promise<unknown> = Promise.resolve();

async function withRenderLock<T>(fn: () => Promise<T>): Promise<T> {
  const prev = renderLock;
  let release: () => void = () => undefined;
  renderLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  await prev.catch(() => undefined);
  try {
    return await fn();
  } finally {
    release();
  }
}

export async function getPdfjs(): Promise<Pdfjs> {
  if (!pdfjsMod) {
    pdfjsMod = await import("pdfjs-dist");
  }
  if (!configured) {
    const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    pdfjsMod.GlobalWorkerOptions.workerSrc = workerUrl;
    configured = true;
  }
  return pdfjsMod;
}

export async function getPdfDoc(bytes: Uint8Array): Promise<PDFDocumentProxy> {
  const existing = docs.get(bytes);
  if (existing) return existing;
  const pdfjsLib = await getPdfjs();
  const promise = pdfjsLib.getDocument({ data: bytes.slice() }).promise;
  docs.set(bytes, promise);
  try {
    return await promise;
  } catch (err) {
    docs.delete(bytes);
    throw err;
  }
}

export async function dropPdfDoc(bytes: Uint8Array) {
  const promise = docs.get(bytes);
  if (!promise) return;
  docs.delete(bytes);
  try {
    const doc = await promise;
    await doc.destroy();
  } catch {
    /* ignore */
  }
}

export async function renderPage(options: {
  bytes: Uint8Array;
  pageIndex: number;
  canvas: HTMLCanvasElement;
  scale: number;
  rotation?: number;
  dpr?: number;
}): Promise<{ viewport: PageViewport }> {
  return withRenderLock(async () => {
    const doc = await getPdfDoc(options.bytes);
    const page = await doc.getPage(options.pageIndex + 1);
    const rotation = options.rotation ?? 0;
    const viewport = page.getViewport({ scale: options.scale, rotation });
    const dpr = options.dpr ?? 1;
    const canvas = options.canvas;
    canvas.width = Math.max(1, Math.floor(viewport.width * dpr));
    canvas.height = Math.max(1, Math.floor(viewport.height * dpr));
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available in this browser.");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, viewport.width, viewport.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    return { viewport };
  });
}

export async function pageCountOf(bytes: Uint8Array): Promise<number> {
  const doc = await getPdfDoc(bytes);
  return doc.numPages;
}
