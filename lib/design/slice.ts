import sharp, { type Sharp } from "sharp";
import { SCALE, type MeasuredSection } from "./render";

// Cuts the 2x render at section boundaries, splits very tall sections at a quiet row,
// and compresses each slice, keeping whichever format comes out smaller [SOP: ≥70% smaller].

const MAX_SLICE_CSS_PX = 900;

export type Slice = {
  index: number;
  sectionId: string;
  file: string;
  format: "jpg" | "png";
  bytes: number;
  rawBytes: number;
  savedPct: number;
  width: number;
  height: number;
  link: string;
  alt: string;
  data: Buffer;
};

// Finds the most uniform pixel row between 35% and 65% of the band, to split there
// instead of through text or a product.
async function quietRow(img: Sharp, top: number, height: number, width: number) {
  const { data, info } = await img.clone().extract({ left: 0, top, width, height }).raw().toBuffer({ resolveWithObject: true });
  let best = Math.round(height / 2);
  let bestScore = Infinity;
  for (let y = Math.round(height * 0.35); y < height * 0.65; y++) {
    let sum = 0;
    let sumSq = 0;
    const row = y * width * info.channels;
    for (let x = 0; x < width * info.channels; x += info.channels) {
      const v = data[row + x] + data[row + x + 1] + data[row + x + 2];
      sum += v;
      sumSq += v * v;
    }
    const n = width;
    const variance = sumSq / n - (sum / n) ** 2;
    if (variance < bestScore) {
      bestScore = variance;
      best = y;
    }
  }
  return best;
}

async function compress(region: Sharp) {
  const raw = await region.clone().png().toBuffer();
  const jpg = await region.clone().flatten({ background: "#ffffff" }).jpeg({ quality: 78, mozjpeg: true }).toBuffer();
  const png = await region.clone().png({ palette: true, quality: 82, effort: 10, compressionLevel: 9 }).toBuffer();
  const [data, format] = jpg.length <= png.length ? [jpg, "jpg" as const] : [png, "png" as const];
  return { data, format, rawBytes: raw.length };
}

export async function sliceEmail(
  png: Buffer,
  sections: MeasuredSection[],
  meta: Record<string, { link: string; alt: string }>,
): Promise<Slice[]> {
  const img = sharp(png);
  const { width = 0, height: imgH = 0 } = await img.metadata();

  // Bands in 2x pixels. Rounding to whole pixels; each band starts where the last ended so nothing is lost.
  const bands: { sectionId: string; top: number; height: number }[] = [];
  for (const s of sections) {
    const top = Math.round(s.y * SCALE);
    const bottom = Math.min(imgH, Math.round((s.y + s.height) * SCALE));
    let start = top;
    while (bottom - start > MAX_SLICE_CSS_PX * SCALE) {
      const span = Math.min(bottom - start, MAX_SLICE_CSS_PX * SCALE * 2);
      const cut = start + (await quietRow(img, start, span, width));
      bands.push({ sectionId: s.id, top: start, height: cut - start });
      start = cut;
    }
    bands.push({ sectionId: s.id, top: start, height: bottom - start });
  }

  const slices: Slice[] = [];
  for (const [index, b] of bands.entries()) {
    if (b.height <= 0) continue;
    const region = sharp(png).extract({ left: 0, top: b.top, width, height: b.height });
    const { data, format, rawBytes } = await compress(region);
    const m = meta[b.sectionId];
    slices.push({
      index,
      sectionId: b.sectionId,
      file: `slice-${String(index + 1).padStart(2, "0")}-${b.sectionId}.${format}`,
      format,
      bytes: data.length,
      rawBytes,
      savedPct: Math.round((1 - data.length / rawBytes) * 100),
      width,
      height: b.height,
      link: m.link,
      alt: m.alt,
      data,
    });
  }
  return slices;
}
