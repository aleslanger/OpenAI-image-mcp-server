import type { ModelCaps } from "./model-registry.js";

type Result = { ok: true } | { ok: false; reason: string };

export function validateSize(caps: ModelCaps, size: string): Result {
  if (size === "auto" || caps.sizePresets.includes(size)) return { ok: true };
  const m = /^(\d+)x(\d+)$/.exec(size);
  if (!m) return { ok: false, reason: `invalid size format: ${size}` };
  if (!caps.allowsCustomSize)
    return { ok: false, reason: `model ${caps.id} allows only presets: ${caps.sizePresets.join(", ")}` };
  const w = Number(m[1]), h = Number(m[2]);
  if (w % 16 !== 0 || h % 16 !== 0)
    return { ok: false, reason: `both dimensions must be divisible by 16` };
  if (w > 3840 || h > 3840)
    return { ok: false, reason: `max edge is 3840px` };
  const ratio = Math.max(w / h, h / w);
  if (ratio > 3) return { ok: false, reason: `aspect ratio must be <= 3:1` };
  const px = w * h;
  if (px < 655360 || px > 8294400)
    return { ok: false, reason: `total pixels must be 655360..8294400` };
  return { ok: true };
}
