import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  cleanFontName,
  quoteFamily,
  detectFont,
  fontStack,
  canvasFont,
  letterSpacingPx,
  sampleTextLooks,
} from "./font-match.ts";

describe("cleanFontName", () => {
  it("strips subset prefix even when leading space is present", () => {
    assert.equal(cleanFontName("ABCDEF+Calibri"), "Calibri");
    assert.equal(cleanFontName(" ABCDEF+Calibri "), "Calibri");
    assert.equal(cleanFontName("XYZABC+Times-Bold"), "Times-Bold");
  });

  it("normalizes pdfjs generated IDs and delimiters", () => {
    assert.equal(cleanFontName("g_d0_f1"), "");
    assert.equal(cleanFontName("Arial_Bold,MT"), "Arial Bold MT");
  });
});

describe("quoteFamily", () => {
  it("quotes font family names containing spaces or identifiers", () => {
    assert.equal(quoteFamily("Helvetica Neue"), '"Helvetica Neue"');
    assert.equal(quoteFamily("Arial"), '"Arial"');
  });

  it("does not quote CSS generic family keywords", () => {
    assert.equal(quoteFamily("sans-serif"), "sans-serif");
    assert.equal(quoteFamily("serif"), "serif");
    assert.equal(quoteFamily("monospace"), "monospace");
  });
});

describe("detectFont", () => {
  it("detects bold and italic from common PDF font names", () => {
    const bold1 = detectFont("Arial-BoldMT");
    assert.equal(bold1.bold, true);
    assert.equal(bold1.faceBold, true);
    assert.equal(bold1.italic, false);
    assert.equal(bold1.kind, "helvetica");

    const italic1 = detectFont("Helvetica-Oblique");
    assert.equal(italic1.italic, true);
    assert.equal(italic1.faceItalic, true);
    assert.equal(italic1.bold, false);

    const boldItalic = detectFont("TimesNewRomanPS-BoldItalicMT");
    assert.equal(boldItalic.bold, true);
    assert.equal(boldItalic.italic, true);
    assert.equal(boldItalic.kind, "times");
  });

  it("detects bold from abbreviated PostScript names", () => {
    const bd = detectFont("Arial-Bd");
    assert.equal(bd.bold, true);

    const timesBd = detectFont("TimesBD");
    assert.equal(timesBd.bold, true);

    const bld = detectFont("Calibri-Bld");
    assert.equal(bld.bold, true);
  });
  it("detects numeric weight from font names", () => {
    const med = detectFont("Arial-Medium");
    assert.equal(med.weight, 500);
    assert.equal(med.bold, false);

    const semi = detectFont("Inter-SemiBold");
    assert.equal(semi.weight, 600);
    assert.equal(semi.bold, true);

    const black = detectFont("Roboto-Black");
    assert.equal(black.weight, 900);
    assert.equal(black.bold, true);
  });
});

describe("canvasFont", () => {
  it("outputs 700 weight when bold is true", () => {
    const result1 = canvasFont(16, "helvetica", true, false, "Arial, sans-serif", "Arial-BoldMT");
    assert.match(result1, /^700 16px/);

    const result2 = canvasFont(16, "helvetica", false, false, "Arial, sans-serif");
    assert.match(result2, /^400 16px/);
  });

  it("outputs custom numeric weight when provided", () => {
    const result = canvasFont(16, "helvetica", false, false, "Arial, sans-serif", undefined, 500);
    assert.match(result, /^500 16px/);
  });

  it("always outputs italic style when italic is true", () => {
    const result1 = canvasFont(14, "times", false, true, "Times, serif", "Times-Italic");
    assert.match(result1, /^italic 400 14px/);

    const result2 = canvasFont(14, "times", true, true, "Times, serif", "Times-BoldItalic");
    assert.match(result2, /^italic 700 14px/);
  });
});

describe("letterSpacingPx", () => {
  it("computes reasonable spacing bounds", () => {
    const spacing = letterSpacingPx(100, 105, 5);
    assert.ok(spacing > 0);

    const zero = letterSpacingPx(0, 100, 5);
    assert.equal(zero, 0);
  });
});

describe("sampleTextLooks", () => {
  it("isolates core ink from anti-aliased pixels without fading to gray", () => {
    // Construct mock canvas getImageData with mostly white paper, black core, and anti-aliased edge pixels
    const width = 20;
    const height = 10;
    const data = new Uint8ClampedArray(width * height * 4);
    // Fill with white paper
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }
    // 10 core black pixels in the center
    for (let p = 50; p < 60; p++) {
      data[p * 4] = 0;
      data[p * 4 + 1] = 0;
      data[p * 4 + 2] = 0;
    }
    // 30 anti-aliased edge pixels (mix of 80 to 220)
    for (let p = 60; p < 90; p++) {
      const v = 80 + (p - 60) * 4;
      data[p * 4] = v;
      data[p * 4 + 1] = v;
      data[p * 4 + 2] = v;
    }

    const mockCanvas = {
      width,
      height,
      getContext: () => ({
        getImageData: () => ({ data }),
      }),
    } as unknown as HTMLCanvasElement;

    const looks = sampleTextLooks(mockCanvas, { nx: 0, ny: 0, nw: 1, nh: 1 });
    // Text color MUST stay crisp black (#111111) rather than gray (#696969)
    assert.equal(looks.color, "#111111");
    assert.equal(looks.coverColor, "#ffffff");
  });
});
