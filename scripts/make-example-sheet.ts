// Turns a tall email design into a compact example sheet in the same format as the
// fluid-email-designer skill's: scaled to 440px wide, cut into 1500px columns read top to
// bottom, left to right, on magenta, saved as compressed JPEG.
// Usage: tsx scripts/make-example-sheet.ts <input.png> <output.jpg>

import sharp from "sharp";

const COL_W = 440;
const COL_H = 1500;
const GAP = 16;
const MAGENTA = { r: 255, g: 0, b: 255 };

export async function makeSheet(input: string, output: string) {
  const scaled = await sharp(input, { limitInputPixels: false }).resize({ width: COL_W }).png().toBuffer();
  const { height = 0 } = await sharp(scaled).metadata();
  const cols = Math.ceil(height / COL_H);
  const parts = await Promise.all(
    Array.from({ length: cols }, (_, i) =>
      sharp(scaled).extract({ left: 0, top: i * COL_H, width: COL_W, height: Math.min(COL_H, height - i * COL_H) }).toBuffer(),
    ),
  );
  const width = cols * COL_W + (cols - 1) * GAP;
  const sheetH = Math.min(height, COL_H);
  await sharp({ create: { width, height: sheetH, channels: 3, background: MAGENTA } })
    .composite(parts.map((p, i) => ({ input: p, left: i * (COL_W + GAP), top: 0 })))
    .jpeg({ quality: 76, mozjpeg: true })
    .toFile(output);
  return { cols, width, height: sheetH };
}

if (process.argv[2] && process.argv[3]) {
  makeSheet(process.argv[2], process.argv[3]).then((r) => console.log(`${process.argv[3]}: ${r.cols} columns, ${r.width}x${r.height}`));
}
