export type WorkspaceKind =
  | "editor"
  | "organize"
  | "compress"
  | "images-to-pdf"
  | "pdf-to-images"
  | "watermark"
  | "page-numbers";

export type OrganizeMode = "merge" | "split" | "delete" | "rotate" | "organize" | "extract";
export type EditorMode = "edit" | "sign" | "insert";

export type ToolDef = {
  slug: string;
  name: string;
  short: string;
  title: string;
  description: string;
  h1: string;
  lead: string;
  workspace: WorkspaceKind;
  organizeMode?: OrganizeMode;
  editorMode?: EditorMode;
  hero: boolean;
  accept: string;
  multiple: boolean;
  steps: { title: string; body: string }[];
  faqs: { q: string; a: string }[];
  related: string[];
  keywords: string[];
};

export const TOOLS: ToolDef[] = [
  {
    slug: "edit-pdf",
    name: "Edit PDF",
    short: "Insert text, images, and pages. Sign, highlight, reorder.",
    title: "Free PDF Editor Online — Edit PDF Text, Images & Pages Free | Kitcroft",
    description:
      "100% free online PDF editor. Edit PDF text directly, insert images & pages, sign, highlight, and rearrange. No upload, no signup, no watermark, and no task limits.",
    h1: "Edit PDF online free",
    lead: "Open a file and work on the page — type, insert, sign, and rearrange. The PDF stays in this tab until you download.",
    workspace: "editor",
    editorMode: "edit",
    hero: true,
    accept: "application/pdf,.pdf",
    multiple: false,
    steps: [
      { title: "Open a PDF", body: "Drop a file or start from the sample. Nothing is uploaded." },
      { title: "Mark the page", body: "Click existing text to type in place, or add images, highlights, and a signature. Drag the grip to move. Insert blank or existing PDF pages in the rail." },
      { title: "Download free", body: "Export a clean PDF instantly. 100% free, no watermark, no account." },
    ],
    faqs: [
      {
        q: "Is Kitcroft PDF Editor 100% free?",
        a: "Yes. Kitcroft is 100% free with no hidden fees, no subscriptions, no watermarks, and no task caps. You can edit as many PDFs as you need without creating an account.",
      },
      {
        q: "Does editing upload my PDF?",
        a: "No. Kitcroft reads the file in your browser with pdf.js and writes the result with pdf-lib. Close the tab and the bytes are gone.",
      },
      {
        q: "Can I edit existing PDF text like a Word doc?",
        a: "Yes for digital text: hover a line, click to type in place, drag the grip to move. Scanned pages have no live text — add a new text box instead. Nothing is uploaded.",
      },
      {
        q: "Is there a task or page limit?",
        a: "No hourly quota. Practical limits are your device memory. Very large scans may feel slow; a size notice appears above ~80 MB.",
      },
    ],
    related: ["sign-pdf", "insert-pdf", "merge-pdf", "organize-pdf"],
    keywords: ["edit pdf", "free pdf editor", "pdf editor online free", "edit pdf online free", "edit pdf text free", "free pdf editor no watermark", "edit pdf no upload", "free pdf editor no signup", "unlimited free pdf editor"],
  },
  {
    slug: "merge-pdf",
    name: "Merge PDF",
    short: "Combine PDFs and reorder pages on a visual board.",
    title: "Free PDF Merger Online — Combine PDF Files 100% Free | Kitcroft",
    description:
      "Merge PDF files online for free. Combine multiple PDFs, drag to reorder pages, delete extras, and download one clean PDF. Unlimited files, no 50 MB cap, no signup.",
    h1: "Merge PDF files free",
    lead: "Stack any number of PDFs, then drag pages until the order is right. One download, one file, 100% free.",
    workspace: "organize",
    organizeMode: "merge",
    hero: true,
    accept: "application/pdf,.pdf",
    multiple: true,
    steps: [
      { title: "Drop the files", body: "Add two or more PDFs. Pages appear as a board, labelled by source file." },
      { title: "Arrange", body: "Drag to reorder. Rotate or drop pages you do not need." },
      { title: "Merge free", body: "Download a single PDF. Repeat as often as you want — there is no hourly cap or watermark." },
    ],
    faqs: [
      {
        q: "Is merging PDFs completely free on Kitcroft?",
        a: "Yes! Merging PDFs on Kitcroft is 100% free with no file size caps, no watermarks, and no hourly task limits.",
      },
      {
        q: "How many files can I merge?",
        a: "As many as the browser can hold. Sejda free web limits batches and meters tasks; Kitcroft does not count tasks.",
      },
      {
        q: "Will bookmarks survive?",
        a: "Page content is copied. Bookmarks and some metadata are not rebuilt. If you need outlines preserved, keep a copy of the sources.",
      },
    ],
    related: ["organize-pdf", "split-pdf", "compress-pdf", "edit-pdf"],
    keywords: ["merge pdf", "merge pdf free", "combine pdf free", "join pdf files free", "merge pdf online free", "free pdf merger", "combine pdf no upload", "unlimited merge pdf free"],
  },
  {
    slug: "compress-pdf",
    name: "Compress PDF",
    short: "Shrink scans and image-heavy PDFs on this device.",
    title: "Free PDF Compressor — Reduce PDF File Size Online Free | Kitcroft",
    description:
      "Compress PDF files online for free. Shrink scans and image-heavy PDFs in your browser without uploading. Live size preview. 100% free, no file size cap, no watermark.",
    h1: "Compress PDF online free",
    lead: "Rebuild image-heavy pages at a size you choose. Preview the new weight, then save — the original never leaves the device.",
    workspace: "compress",
    hero: true,
    accept: "application/pdf,.pdf",
    multiple: false,
    steps: [
      { title: "Choose a file", body: "Drop a PDF. Page count and original size show immediately." },
      { title: "Pick a profile", body: "Strong, balanced, or keep-quality. Each profile caps pixel size and JPEG quality." },
      { title: "Compress and save free", body: "Pages are redrawn locally. Download when the new size looks right." },
    ],
    faqs: [
      {
        q: "Can I compress PDFs for free without file limits?",
        a: "Yes. Kitcroft compresses your PDFs directly in your browser for free with no file size limits, no daily caps, and no watermark.",
      },
      {
        q: "Why did a text PDF not shrink much?",
        a: "Compression rasterizes pages so scans and photo PDFs drop a lot. A lean vector/text file is already small; rasterizing it can even grow the file. Use Balanced only on image-heavy documents.",
      },
      {
        q: "Is this the same as Sejda compress?",
        a: "Sejda compresses on a server and meters free tasks. Kitcroft compresses in the tab. Quality sliders are honest: you trade sharpness for bytes.",
      },
    ],
    related: ["pdf-to-jpg", "merge-pdf", "edit-pdf"],
    keywords: ["compress pdf", "reduce pdf size", "compress pdf online free", "shrink pdf"],
  },
  {
    slug: "split-pdf",
    name: "Split PDF",
    short: "Cut a PDF into new files at the pages you mark.",
    title: "Free PDF Splitter Online — Split & Cut PDF Pages Free | Kitcroft",
    description:
      "Split PDF files online for free. Cut pages into separate PDFs or export every page as an individual file. Download zip instantly. 100% free, no upload, no signup.",
    h1: "Split PDF pages free",
    lead: "Place cuts between pages or export each page. Get a zip of new PDFs without sending the original anywhere.",
    workspace: "organize",
    organizeMode: "split",
    hero: false,
    accept: "application/pdf,.pdf",
    multiple: false,
    steps: [
      { title: "Open the PDF", body: "Pages line up in order." },
      { title: "Mark cuts", body: "Click the gap after a page to split there, or choose one-file-per-page." },
      { title: "Download free zip", body: "Each range becomes its own PDF. 100% free, no watermark." },
    ],
    faqs: [
      {
        q: "Is Kitcroft PDF Splitter free?",
        a: "Yes! Splitting PDFs on Kitcroft is 100% free with no file limits, no sign-up, and no watermarks.",
      },
      {
        q: "Can I split by bookmarks or file size?",
        a: "This version splits by page. Bookmark and size splits need extra parsing; page cuts cover the usual case.",
      },
    ],
    related: ["extract-pages", "delete-pages", "merge-pdf"],
    keywords: ["split pdf", "split pdf free", "split pdf online free", "cut pdf pages free", "separate pdf pages free", "split pdf into multiple files free"],
  },
  {
    slug: "delete-pages",
    name: "Delete PDF pages",
    short: "Remove pages and download the rest.",
    title: "Delete PDF Pages Free Online — Remove Pages from PDF | Kitcroft",
    description:
      "Delete pages from PDF files online for free. Select pages to remove and download your clean PDF instantly. 100% free, unlimited use, no upload, files stay private.",
    h1: "Delete PDF pages free",
    lead: "Click the pages that should go. What remains is saved as a new file on this device.",
    workspace: "organize",
    organizeMode: "delete",
    hero: false,
    accept: "application/pdf,.pdf",
    multiple: false,
    steps: [
      { title: "Open the PDF", body: "Thumbnails load locally." },
      { title: "Select pages to remove", body: "Toggle any page. A counter shows how many will be kept." },
      { title: "Download free", body: "The leftover pages write to a new PDF instantly." },
    ],
    faqs: [
      { q: "Is removing PDF pages free?", a: "Yes, deleting pages is 100% free with no caps or watermarks." },
      { q: "Can I undo a delete before download?", a: "Yes. Toggle the page again. Nothing is written until you download." },
    ],
    related: ["extract-pages", "organize-pdf", "split-pdf"],
    keywords: ["delete pdf pages", "delete pdf pages free", "remove pages from pdf free", "drop pdf pages free", "delete pages from pdf online free"],
  },
  {
    slug: "rotate-pdf",
    name: "Rotate PDF",
    short: "Turn pages 90° at a time, then save.",
    title: "Rotate PDF Free Online — Permanently Rotate PDF Pages | Kitcroft",
    description:
      "Rotate PDF pages online for free. Fix upside-down or sideways scans 90 degrees at a time. Rotate individual pages or the entire document. 100% free, no upload.",
    h1: "Rotate PDF pages free",
    lead: "Spin a page or the whole document. The rotation is written into the downloaded file.",
    workspace: "organize",
    organizeMode: "rotate",
    hero: false,
    accept: "application/pdf,.pdf",
    multiple: false,
    steps: [
      { title: "Open the PDF", body: "Each thumbnail has a rotate control." },
      { title: "Rotate", body: "90° steps, per page or all at once." },
      { title: "Download free", body: "The new orientation is stored in the PDF." },
    ],
    faqs: [
      { q: "Is rotating PDF pages free?", a: "Yes, 100% free with no limits and no watermark." },
      { q: "Does this flatten the file?", a: "No. Pages are copied with a rotation flag. Vector content stays vector." },
    ],
    related: ["organize-pdf", "edit-pdf", "compress-pdf"],
    keywords: ["rotate pdf", "rotate pdf free", "rotate pdf pages free", "fix sideways pdf free", "rotate pdf online free", "permanently rotate pdf"],
  },
  {
    slug: "organize-pdf",
    name: "Organize PDF",
    short: "Reorder, rotate, and drop pages on one board.",
    title: "Organize PDF Free Online — Reorder, Rotate & Delete Pages | Kitcroft",
    description:
      "Organize PDF pages online for free. Drag and drop to reorder, rotate, delete, or insert pages on a visual board. 100% free, unlimited, no registration required.",
    h1: "Organize PDF pages free",
    lead: "A single board for order, rotation, and culls — then one clean file out.",
    workspace: "organize",
    organizeMode: "organize",
    hero: false,
    accept: "application/pdf,.pdf",
    multiple: true,
    steps: [
      { title: "Drop one or more PDFs", body: "All pages land on the board." },
      { title: "Sort", body: "Drag, rotate, exclude. Insert another file at the end." },
      { title: "Save free", body: "Download the new sequence." },
    ],
    faqs: [
      { q: "Is organizing PDF pages free?", a: "Yes, 100% free with unlimited tasks and no signup required." },
      { q: "Is this different from merge?", a: "Merge is for stacking files. Organize is the same board with reorder and rotate as the default job." },
    ],
    related: ["merge-pdf", "edit-pdf", "delete-pages"],
    keywords: ["organize pdf", "organize pdf free", "reorder pdf pages free", "sort pdf pages online free", "rearrange pdf pages free"],
  },
  {
    slug: "extract-pages",
    name: "Extract pages",
    short: "Keep only the pages you pick.",
    title: "Extract PDF Pages Free Online — Save Specific Pages Free | Kitcroft",
    description:
      "Extract pages from PDF files online for free. Select only the pages you need and save them as a new PDF. 100% free, private in-browser processing, no upload.",
    h1: "Extract PDF pages free",
    lead: "Pick the pages you need. The rest stay out of the download.",
    workspace: "organize",
    organizeMode: "extract",
    hero: false,
    accept: "application/pdf,.pdf",
    multiple: false,
    steps: [
      { title: "Open the PDF", body: "Every page starts unselected." },
      { title: "Select pages to keep", body: "Click thumbnails, or use select all." },
      { title: "Extract", body: "Download a PDF that contains only those pages." },
    ],
    faqs: [{ q: "How is this different from delete pages?", a: "Delete starts with everything kept. Extract starts with nothing kept. Same engine, opposite default." }],
    related: ["split-pdf", "delete-pages", "merge-pdf"],
    keywords: ["extract pdf pages", "save pdf pages", "pull pages from pdf"],
  },
  {
    slug: "jpg-to-pdf",
    name: "JPG to PDF",
    short: "Turn images into a PDF, in the order you set.",
    title: "Convert JPG to PDF Free Online — Image to PDF Converter | Kitcroft",
    description:
      "Convert JPG, PNG, and WebP images to PDF online for free. Drag images to reorder, pick page fit, and download your PDF instantly. 100% free, unlimited photos, no upload.",
    h1: "Convert JPG and PNG to PDF free",
    lead: "Drop photos or scans, drag them into order, and bind them as a PDF.",
    workspace: "images-to-pdf",
    hero: false,
    accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
    multiple: true,
    steps: [
      { title: "Add images", body: "JPG, PNG, or WebP. Several at once is fine." },
      { title: "Order and fit", body: "Drag to sort. Fit-to-page or wrap on A4 / Letter." },
      { title: "Build PDF free", body: "Each image becomes a page. 100% free download." },
    ],
    faqs: [
      { q: "Is converting JPG to PDF free?", a: "Yes, 100% free with no limits on photo count or file size." },
      { q: "Are the images compressed?", a: "JPEGs embed as JPEG. PNGs embed as PNG. No extra server recompression." },
    ],
    related: ["pdf-to-jpg", "merge-pdf", "compress-pdf"],
    keywords: ["jpg to pdf", "jpg to pdf free", "convert jpg to pdf free", "png to pdf free", "images to pdf free", "convert photo to pdf free"],
  },
  {
    slug: "pdf-to-jpg",
    name: "PDF to JPG",
    short: "Render each page to a JPG on this device.",
    title: "Convert PDF to JPG Free Online — High Quality Image Extractor | Kitcroft",
    description:
      "Convert PDF to JPG or PNG images online for free. Extract every page as a high-resolution image and download as a zip. 100% free, no file upload, runs in your browser.",
    h1: "Convert PDF to JPG free",
    lead: "Each page is drawn to an image in this tab. Save one page or a zip of all.",
    workspace: "pdf-to-images",
    hero: false,
    accept: "application/pdf,.pdf",
    multiple: false,
    steps: [
      { title: "Open a PDF", body: "Pages render as you scroll." },
      { title: "Set scale", body: "Higher scale means sharper, heavier JPGs." },
      { title: "Download free", body: "A zip of page-01.jpg and so on. 100% free." },
    ],
    faqs: [
      { q: "Is PDF to JPG conversion free?", a: "Yes, 100% free with high resolution export and no watermarks." },
      { q: "Can I export PNG instead?", a: "The default is JPG for size. PNG is available in the format control." },
    ],
    related: ["jpg-to-pdf", "compress-pdf", "extract-pages"],
    keywords: ["pdf to jpg", "pdf to jpg free", "convert pdf to jpg free", "pdf to png free", "convert pdf to image free", "extract images from pdf free"],
  },
  {
    slug: "watermark-pdf",
    name: "Watermark PDF",
    short: "Stamp text across every page, then download.",
    title: "Free PDF Watermark Online — Stamp Text or Watermark to PDF | Kitcroft",
    description:
      "Add text watermarks and stamps to PDF files online for free. Custom font, opacity, rotation, and repeat tiling. 100% free, no watermark on Kitcroft, unlimited use.",
    h1: "Watermark a PDF free",
    lead: "Stamp a line such as Confidential or Draft on every page. You choose the weight of the mark.",
    workspace: "watermark",
    hero: false,
    accept: "application/pdf,.pdf",
    multiple: false,
    steps: [
      { title: "Open a PDF", body: "The first page previews the stamp." },
      { title: "Set the mark", body: "Text, size, rotation, opacity, color." },
      { title: "Apply free", body: "Every page receives the same stamp." },
    ],
    faqs: [
      { q: "Is adding a watermark to PDF free?", a: "Yes, 100% free with full custom styling and no account needed." },
      { q: "Can I tile the watermark?", a: "Yes. Use Repeat to fill the page, or keep a single centered mark." },
    ],
    related: ["page-numbers", "edit-pdf", "sign-pdf"],
    keywords: ["watermark pdf", "watermark pdf free", "add watermark to pdf free", "stamp pdf free", "confidential watermark pdf free"],
  },
  {
    slug: "page-numbers",
    name: "Page numbers",
    short: "Number every page in a header or footer.",
    title: "Add Page Numbers to PDF Free Online — Number PDF Pages | Kitcroft",
    description:
      "Add page numbers to PDF documents online for free. Choose header or footer placement, custom numbering formats, and starting number. 100% free, no upload.",
    h1: "Add page numbers to PDF free",
    lead: "Place 1, 1 of N, or Page 1 in a header or footer, then download.",
    workspace: "page-numbers",
    hero: false,
    accept: "application/pdf,.pdf",
    multiple: false,
    steps: [
      { title: "Open a PDF", body: "Choose where the number sits." },
      { title: "Format", body: "Plain, Page X, or X of Y. Set a starting number." },
      { title: "Apply free", body: "Numbers draw in the margin, not over the body if you keep the default inset." },
    ],
    faqs: [
      { q: "Is numbering PDF pages free?", a: "Yes, 100% free with customizable placement and formatting." },
      { q: "Will numbers cover existing headers?", a: "They draw in from the edge. If a document already has a footer, pick the opposite margin." },
    ],
    related: ["watermark-pdf", "organize-pdf", "edit-pdf"],
    keywords: ["add page numbers to pdf", "add page numbers to pdf free", "number pdf pages free", "pdf pagination free", "page numbers pdf online free"],
  },
  {
    slug: "insert-pdf",
    name: "Insert PDF",
    short: "Slip pages from another file into the one you are editing.",
    title: "Insert Pages into PDF Free Online — Combine in Editor | Kitcroft",
    description:
      "Insert pages from another PDF into your document online for free. Add pages anywhere in the sequence, preview, and download. 100% free, unlimited, no signup.",
    h1: "Insert PDF pages free",
    lead: "Open a base file, then inject pages from others at the cursor. Same workbench as Edit PDF.",
    workspace: "editor",
    editorMode: "insert",
    hero: false,
    accept: "application/pdf,.pdf",
    multiple: false,
    steps: [
      { title: "Open the base PDF", body: "This is the document you are adding to." },
      { title: "Insert", body: "Use Insert PDF in the rail or drop a file between thumbnails." },
      { title: "Download free", body: "One file, with the new pages in place. 100% free." },
    ],
    faqs: [
      { q: "Is inserting pages into a PDF free?", a: "Yes, 100% free with no page limits." },
      { q: "Can I insert in the middle, not the end?", a: "Yes. Select the page that should sit before the insert, then add. Or drop on the gap between thumbs." },
    ],
    related: ["edit-pdf", "merge-pdf", "organize-pdf"],
    keywords: ["insert pdf", "insert pdf pages free", "add pages to pdf free", "insert pages into pdf free", "insert pdf free online"],
  },
  {
    slug: "sign-pdf",
    name: "Sign PDF",
    short: "Draw a signature and place it on the page.",
    title: "Sign PDF Free Online — Fill & Sign PDF Documents Free | Kitcroft",
    description:
      "Sign PDF documents online for free. Draw your signature, place it anywhere on the form, and add text, date, or names. 100% free, no watermark, no account needed.",
    h1: "Sign a PDF online free",
    lead: "Draw once, place it wherever the form asks. Add printed name or date as text.",
    workspace: "editor",
    editorMode: "sign",
    hero: false,
    accept: "application/pdf,.pdf",
    multiple: false,
    steps: [
      { title: "Open the form", body: "Use a PDF, not a photo of a form, for a sharp result." },
      { title: "Draw the signature", body: "Sign on the pad, then click the page to place it. Resize from the corners." },
      { title: "Download free", body: "The mark is embedded. 100% free, no Kitcroft stamp or watermark." },
    ],
    faqs: [
      { q: "Is signing PDFs on Kitcroft free?", a: "Yes, 100% free with unlimited form signing and no watermark." },
      {
        q: "Is this a legally binding e-sign?",
        a: "It is a visual signature embedded in the PDF, the same class as a wet-ink scan. It is not a certificate-based digital signature (PAdES).",
      },
    ],
    related: ["edit-pdf", "watermark-pdf", "jpg-to-pdf"],
    keywords: ["sign pdf", "sign pdf free", "fill and sign pdf free", "free pdf signature", "sign pdf online free", "add signature to pdf free"],
  },
];

export const TOOL_MAP = new Map(TOOLS.map((t) => [t.slug, t]));

export function getTool(slug: string | undefined): ToolDef | undefined {
  if (!slug) return undefined;
  return TOOL_MAP.get(slug);
}

export function isToolSlug(slug: string): boolean {
  return TOOL_MAP.has(slug);
}

export const HERO_TOOLS = TOOLS.filter((t) => t.hero);
export const OTHER_TOOLS = TOOLS.filter((t) => !t.hero);
