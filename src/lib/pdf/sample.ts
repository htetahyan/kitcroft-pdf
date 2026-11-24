import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";

export async function buildSamplePdf(): Promise<{ bytes: Uint8Array; name: string }> {
  const doc = await PDFDocument.create();
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const ink = rgb(0.1, 0.1, 0.09);
  const muted = rgb(0.42, 0.41, 0.38);
  const teal = rgb(0.12, 0.29, 0.27);
  const rule = rgb(0.81, 0.78, 0.71);
  const paper = rgb(0.99, 0.98, 0.96);

  const page1 = doc.addPage([612, 792]);
  page1.drawRectangle({ x: 0, y: 0, width: 612, height: 792, color: paper });
  page1.drawRectangle({ x: 0, y: 742, width: 612, height: 50, color: teal });
  page1.drawText("KITCROFT  ·  SAMPLE DOCUMENT", {
    x: 48,
    y: 760,
    size: 11,
    font: sans,
    color: rgb(0.95, 0.94, 0.91),
  });
  page1.drawText("Q-4418", {
    x: 500,
    y: 760,
    size: 11,
    font: sans,
    color: rgb(0.95, 0.94, 0.91),
  });

  page1.drawText("Field report", {
    x: 48,
    y: 680,
    size: 32,
    font: serifBold,
    color: ink,
  });
  page1.drawText("North annex  ·  21 September 2026", {
    x: 48,
    y: 650,
    size: 12,
    font: sans,
    color: muted,
  });
  page1.drawLine({ start: { x: 48, y: 632 }, end: { x: 564, y: 632 }, thickness: 0.6, color: rule });

  const intro =
    "This file is generated in your browser so you can try Edit, Merge, and Compress without choosing a document of your own. Add a heading, drop a signature, insert a blank page, then download — the bytes never leave this tab.";
  wrap(page1, intro, 48, 600, 500, 11.5, 16, sans, ink);

  const rows = [
    ["Item", "Qty", "Notes"],
    ["Cover sheet", "1", "Replace the title on page 1"],
    ["Site photos", "4", "Insert after page 2"],
    ["Signed copy", "1", "Use Sign PDF, then flatten"],
  ];
  let y = 470;
  rows.forEach((row, i) => {
    if (i === 0) {
      page1.drawRectangle({ x: 48, y: y - 8, width: 516, height: 22, color: rgb(0.91, 0.88, 0.82) });
    }
    page1.drawText(row[0], { x: 56, y, size: 10, font: i === 0 ? serifBold : sans, color: ink });
    page1.drawText(row[1], { x: 220, y, size: 10, font: sans, color: ink });
    page1.drawText(row[2], { x: 280, y, size: 10, font: sans, color: ink });
    y -= 26;
  });

  page1.drawRectangle({ x: 48, y: 88, width: 516, height: 64, color: rgb(0.93, 0.95, 0.94) });
  page1.drawText("Sign below", {
    x: 60,
    y: 128,
    size: 9,
    font: sans,
    color: teal,
  });
  page1.drawLine({ start: { x: 60, y: 104 }, end: { x: 280, y: 104 }, thickness: 0.8, color: rule });
  page1.drawText("Authorized signature", { x: 60, y: 92, size: 8, font: sans, color: muted });

  const page2 = doc.addPage([612, 792]);
  page2.drawRectangle({ x: 0, y: 0, width: 612, height: 792, color: paper });
  page2.drawText("Notes", { x: 48, y: 720, size: 26, font: serifBold, color: ink });
  page2.drawLine({ start: { x: 48, y: 704 }, end: { x: 564, y: 704 }, thickness: 0.6, color: rule });
  wrap(
    page2,
    "Use the page rail to insert another PDF between these two pages, or drop an image on the canvas. Rotate a page if a scan lands sideways. Compress is meant for photo-heavy files — this sample is mostly text, so it will not shrink much, and that is expected.",
    48,
    670,
    500,
    12,
    18,
    serif,
    ink,
  );
  wrap(
    page2,
    "Sejda’s free web tools stop after three tasks an hour and refuse files over 50 MB or 200 pages. This workbench does not meter tasks. If the file is huge, the only ceiling is memory in this browser.",
    48,
    540,
    500,
    12,
    18,
    serif,
    ink,
  );
  page2.drawRectangle({ x: 420, y: 120, width: 140, height: 140, color: teal });
  page2.drawText("P. 2", {
    x: 458,
    y: 178,
    size: 22,
    font: serifBold,
    color: rgb(0.95, 0.94, 0.91),
    rotate: degrees(0),
  });
  page2.drawText("KITCROFT", { x: 48, y: 48, size: 10, font: sans, color: muted });

  return { bytes: await doc.save(), name: "kitcroft-sample.pdf" };
}

function wrap(
  page: ReturnType<PDFDocument["addPage"]>,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  lineHeight: number,
  font: { widthOfTextAtSize: (t: string, s: number) => number },
  color: ReturnType<typeof rgb>,
) {
  const words = text.split(" ");
  let line = "";
  let cy = y;
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth) {
      page.drawText(line, { x, y: cy, size, font: font as never, color });
      line = word;
      cy -= lineHeight;
    } else {
      line = next;
    }
  }
  if (line) page.drawText(line, { x, y: cy, size, font: font as never, color });
}
