import { readImageMeta } from "./image-meta.js";

export class MaskError extends Error {}
const MAX = 50 * 1024 * 1024;

export async function validateMask(image: Buffer, mask: Buffer): Promise<void> {
  if (mask.length > MAX) throw new MaskError("mask exceeds 50MB");
  const [im, mm] = await Promise.all([readImageMeta(image), readImageMeta(mask)]);
  if (!mm.hasAlpha) throw new MaskError("mask must contain an alpha channel");
  if (im.width !== mm.width || im.height !== mm.height)
    throw new MaskError(`mask size ${mm.width}x${mm.height} != image ${im.width}x${im.height}`);
}
