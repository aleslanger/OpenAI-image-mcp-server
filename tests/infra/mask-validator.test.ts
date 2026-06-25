import { describe, it, expect } from "vitest";
import { validateMask, MaskError } from "../../src/infra/mask-validator.js";
import { pngWithAlpha, pngOpaque } from "../fixtures/make-fixtures.js";

describe("mask-validator", () => {
  it("accepts matching alpha mask", async () => {
    const img = await pngOpaque(64, 64);
    const mask = await pngWithAlpha(64, 64);
    await expect(validateMask(img, mask)).resolves.toBeUndefined();
  });

  it("rejects mask without alpha", async () => {
    const img = await pngOpaque(64, 64);
    const mask = await pngOpaque(64, 64);
    await expect(validateMask(img, mask)).rejects.toThrow(/alpha/i);
  });

  it("rejects size mismatch", async () => {
    const img = await pngOpaque(64, 64);
    const mask = await pngWithAlpha(32, 32);
    await expect(validateMask(img, mask)).rejects.toThrow(MaskError);
  });
});
