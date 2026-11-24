export type AdSize = "leaderboard" | "rectangle" | "mobile-banner" | "skyscraper" | "slim";

export type AdDefinition = {
  id: string;
  label: string;
  size: AdSize;
  note: string;
};

/**
 * Reserved slots for later ad network tags (AdSense, etc.).
 * Swap the placeholder body in <AdSlot /> — do not change the ids.
 * Layout already holds the space so inserting tags will not shove tools around.
 */
export const AD_SLOTS = {
  header: {
    id: "kitcroft-header",
    label: "Header",
    size: "leaderboard",
    note: "728x90 desktop / 320x50 mobile. Hide on immersive editor if it crowds the canvas.",
  },
  homeMid: {
    id: "kitcroft-home-mid",
    label: "Home in-content",
    size: "rectangle",
    note: "336x280 after the featured tools.",
  },
  homeLower: {
    id: "kitcroft-home-lower",
    label: "Home lower",
    size: "leaderboard",
    note: "728x90 above the FAQ.",
  },
  toolTop: {
    id: "kitcroft-tool-top",
    label: "Tool top",
    size: "leaderboard",
    note: "728x90 under the H1, above the dropzone.",
  },
  toolSidebar: {
    id: "kitcroft-tool-sidebar",
    label: "Tool sidebar",
    size: "skyscraper",
    note: "300x600 or 160x600. Hidden below lg and while a document is open.",
  },
  toolAfter: {
    id: "kitcroft-tool-after",
    label: "After download",
    size: "rectangle",
    note: "336x280 after a successful export.",
  },
  editorTop: {
    id: "kitcroft-editor-top",
    label: "Editor slim",
    size: "slim",
    note: "Only slot visible during edit. Keep height under 90px.",
  },
  footer: {
    id: "kitcroft-footer",
    label: "Footer",
    size: "leaderboard",
    note: "728x90 above legal links.",
  },
} as const satisfies Record<string, AdDefinition>;

export const AD_SIZE_CLASS: Record<AdSize, string> = {
  leaderboard: "min-h-16 w-full max-w-3xl sm:min-h-24",
  rectangle: "min-h-64 w-full max-w-xs",
  "mobile-banner": "min-h-12 w-full max-w-sm",
  skyscraper: "min-h-96 w-full max-w-[300px]",
  slim: "min-h-12 w-full max-w-3xl",
};
