import sharp from "sharp";

export async function pngWithAlpha(w = 32, h = 32): Promise<Buffer> {
  return sharp({ create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .png().toBuffer();
}
export async function pngOpaque(w = 32, h = 32): Promise<Buffer> {
  return sharp({ create: { width: w, height: h, channels: 3, background: { r: 1, g: 2, b: 3 } } })
    .png().toBuffer();
}
