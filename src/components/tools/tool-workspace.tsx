import type { ToolDef } from "@/lib/tools";
import { ClientOnly } from "@/components/client-only";
import { PdfEditor } from "@/components/editor/pdf-editor";
import { OrganizeWorkspace } from "./organize-workspace";
import { CompressWorkspace } from "./compress-workspace";
import { ImagesWorkspace } from "./images-workspace";
import { PdfToImagesWorkspace } from "./pdf-to-images-workspace";
import { WatermarkWorkspace } from "./watermark-workspace";
import { NumbersWorkspace } from "./numbers-workspace";

export function ToolWorkspace({ tool }: { tool: ToolDef }) {
  const fallback = (
    <div className="drop-target flex min-h-52 items-center justify-center rounded-xl text-sm text-muted-foreground">
      Preparing the workbench…
    </div>
  );

  return (
    <ClientOnly fallback={fallback}>
      {tool.workspace === "editor" ? (
        <PdfEditor mode={tool.editorMode ?? "edit"} accept={tool.accept} />
      ) : tool.workspace === "organize" ? (
        <OrganizeWorkspace mode={tool.organizeMode ?? "organize"} accept={tool.accept} multiple={tool.multiple} />
      ) : tool.workspace === "compress" ? (
        <CompressWorkspace accept={tool.accept} />
      ) : tool.workspace === "images-to-pdf" ? (
        <ImagesWorkspace accept={tool.accept} />
      ) : tool.workspace === "pdf-to-images" ? (
        <PdfToImagesWorkspace accept={tool.accept} />
      ) : tool.workspace === "watermark" ? (
        <WatermarkWorkspace accept={tool.accept} />
      ) : (
        <NumbersWorkspace accept={tool.accept} />
      )}
    </ClientOnly>
  );
}
