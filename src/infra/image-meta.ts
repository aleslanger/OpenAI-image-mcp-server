import sharp from "sharp";

export async function readImageMeta(buf: Buffer) {
  const m = await sharp(buf).metadata();
  return {
    width: m.width ?? 0,
    height: m.height ?? 0,
    hasAlpha: m.hasAlpha ?? false,
    format: m.format ?? "unknown",
  };
}
