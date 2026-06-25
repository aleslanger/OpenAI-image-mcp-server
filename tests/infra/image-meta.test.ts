import { describe, it, expect } from "vitest";
import { readImageMeta } from "../../src/infra/image-meta.js";
import { pngWithAlpha, pngOpaque } from "../fixtures/make-fixtures.js";

describe("image-meta", () => {
  it("reads dimensions + alpha", async () => {
    const m = await readImageMeta(await pngWithAlpha(64, 48));
    expect(m.width).toBe(64);
    expect(m.height).toBe(48);
    expect(m.hasAlpha).toBe(true);
    expect(m.format).toBe("png");
  });

  it("detects no alpha", async () => {
    const m = await readImageMeta(await pngOpaque());
    expect(m.hasAlpha).toBe(false);
  });
});
