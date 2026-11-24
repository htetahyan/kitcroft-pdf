import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { Overlay, TextOverlay } from "./types";
import { isBoxOverlay, isTextOverlay } from "./types";

const COLORS = ["#1a1916", "#1e4a45", "#8b3a2a", "#f3e08a", "#fbfaf7", "#2f5d46", "#1d4ed8", "#b45309"];

export function PropPanel({
  overlay,
  zoom,
  onZoom,
  onChange,
  onDelete,
}: {
  overlay: Overlay | null;
  zoom: number;
  onZoom: (zoom: number) => void;
  onChange: (overlay: Overlay) => void;
  onDelete: () => void;
}) {
  return (
    <aside className="hidden border-l border-rule bg-card p-3 lg:block">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Page</p>
      <div className="mt-3 space-y-2">
        <Label htmlFor="zoom">Zoom {Math.round(zoom * 100)}%</Label>
        <Slider id="zoom" min={0.5} max={1.8} step={0.05} value={[zoom]} onValueChange={(v) => onZoom(v[0] ?? zoom)} />
      </div>
      <div className="masthead-rule my-4" />
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Selection</p>
      {!overlay ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Hover a line and click to type in place. Font, size, weight and color stay as in the PDF until you change them
          here. Drag the grip — or pick Move — to move.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {isTextOverlay(overlay) ? <TextFields overlay={overlay} onChange={onChange} /> : null}
          {overlay.type === "highlight" || overlay.type === "rect" ? (
            <Field label="Opacity">
              <Slider
                min={0.1}
                max={0.9}
                step={0.05}
                value={[overlay.opacity]}
                onValueChange={(v) => onChange({ ...overlay, opacity: v[0] ?? overlay.opacity })}
              />
            </Field>
          ) : null}
          {"color" in overlay ? (
            <Field label="Color">
              <div className="flex flex-wrap gap-1.5">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={color}
                    onClick={() => onChange({ ...overlay, color } as Overlay)}
                    className="size-7 rounded-full border border-border"
                    style={{ background: color }}
                  />
                ))}
                <Input
                  type="color"
                  className="h-7 w-10 p-1"
                  value={"color" in overlay ? overlay.color : "#1a1916"}
                  onChange={(e) => onChange({ ...overlay, color: e.target.value } as Overlay)}
                />
              </div>
            </Field>
          ) : null}
          {isBoxOverlay(overlay) ? (
            <p className="text-xs text-muted-foreground">
              Drag the side grip to move. Corner handle resizes. Delete removes. Ctrl/Cmd+D duplicates.
            </p>
          ) : null}
          <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 />
            {overlay.type === "native-text" ? "Remove text" : "Remove"}
          </Button>
        </div>
      )}
    </aside>
  );
}

function TextFields({ overlay, onChange }: { overlay: TextOverlay; onChange: (overlay: Overlay) => void }) {
  const familyValue = overlay.embeddedFamily ? "detected" : overlay.font;
  return (
    <>
      {overlay.type === "native-text" ? (
        <p className="text-xs text-muted-foreground">
          Existing line · {overlay.fontLabel || "detected font"}. Type to replace. Style stays until you change it.
        </p>
      ) : null}
      <Field label="Size">
        <Slider
          min={0.008}
          max={0.12}
          step={0.002}
          value={[overlay.fontN]}
          onValueChange={(v) => onChange({ ...overlay, fontN: v[0] ?? overlay.fontN })}
        />
      </Field>
      <Field label="Font">
        <select
          className="h-10 w-full rounded-md border border-input bg-card px-2 text-sm"
          value={familyValue}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "detected") {
              onChange({ ...overlay });
              return;
            }
            onChange({
              ...overlay,
              font: value as "helvetica" | "times" | "courier",
              embeddedFamily: undefined,
              cssFamily: undefined,
              fontLabel: value === "times" ? "Times" : value === "courier" ? "Courier" : "Helvetica",
              faceBold: overlay.bold,
              faceItalic: !!overlay.italic,
            });
          }}
        >
          {overlay.embeddedFamily || overlay.fontLabel ? (
            <option value="detected">{overlay.fontLabel || "Original PDF font"}</option>
          ) : null}
          <option value="helvetica">Helvetica / Arial</option>
          <option value="times">Times</option>
          <option value="courier">Courier</option>
        </select>
      </Field>
      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={overlay.bold}
            onChange={(e) =>
              onChange({
                ...overlay,
                bold: e.target.checked,
                weight: e.target.checked ? 700 : 400,
                faceBold: e.target.checked,
              })
            }
          />
          Bold
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!overlay.italic}
            onChange={(e) => onChange({ ...overlay, italic: e.target.checked, faceItalic: e.target.checked })}
          />
          Italic
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!overlay.underline} onChange={(e) => onChange({ ...overlay, underline: e.target.checked })} />
          Underline
        </label>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
