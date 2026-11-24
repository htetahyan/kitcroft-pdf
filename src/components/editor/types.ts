export type EditorTool = "select" | "move" | "text" | "highlight" | "draw" | "image" | "signature" | "rect";

export type PageSource =
  | { kind: "pdf"; bytes: Uint8Array; index: number }
  | { kind: "blank"; width: number; height: number };

export type PageRef = {
  id: string;
  rotation: 0 | 90 | 180 | 270;
  source: PageSource;
};

type Box = {
  id: string;
  nx: number;
  ny: number;
  nw: number;
  nh: number;
};

export type TextOverlay = Box & {
  type: "text" | "native-text";
  text: string;
  fontN: number;
  color: string;
  font: "helvetica" | "times" | "courier";
  cssFamily?: string;
  embeddedFamily?: string;
  fontLabel?: string;
  bold: boolean;
  italic?: boolean;
  weight?: number;
  faceBold?: boolean;
  faceItalic?: boolean;
  underline?: boolean;
  coverNx?: number;
  coverNy?: number;
  coverNw?: number;
  coverNh?: number;
  coverColor?: string;
  /** Alphabetic baseline, fraction of page height. */
  baselineN?: number;
  /** True once the user changes or moves native PDF text. */
  edited?: boolean;
  originalText?: string;
  originalNw?: number;
};

export type ImageOverlay = Box & {
  type: "image" | "signature";
  dataUrl: string;
};

export type RectOverlay = Box & {
  type: "highlight" | "rect";
  color: string;
  opacity: number;
};

export type PathOverlay = {
  type: "path";
  id: string;
  points: { nx: number; ny: number }[];
  color: string;
  strokeN: number;
};

export type Overlay = TextOverlay | ImageOverlay | RectOverlay | PathOverlay;

export function isBoxOverlay(mark: Overlay): mark is TextOverlay | ImageOverlay | RectOverlay {
  return mark.type !== "path";
}

export function isTextOverlay(mark: Overlay): mark is TextOverlay {
  return mark.type === "text" || mark.type === "native-text";
}
