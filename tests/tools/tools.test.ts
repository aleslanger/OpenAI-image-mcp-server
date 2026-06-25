import { describe, it, expect, vi } from "vitest";
import * as gen from "../../src/tools/generate-image.js";
import * as caps from "../../src/tools/image-capabilities.js";

describe("tools", () => {
  it("generate schema rejects empty prompt", () => {
    const r = gen.schema.safeParse({ prompt: "" });
    expect(r.success).toBe(false);
  });

  it("generate handler calls service and returns text content", async () => {
    const imageService = { generate: vi.fn().mockResolvedValue({
      results: [{ path: "/tmp/x.png" }], estimateUsd: 0.05, model: "gpt-image-2", size: "1024x1024" }) };
    const res = await gen.handler({ prompt: "a cat" }, { imageService, config: {} } as any);
    expect(imageService.generate).toHaveBeenCalled();
    expect(res.content[0].text).toMatch(/x\.png/);
  });

  it("capabilities returns models + as-of", async () => {
    const res = await caps.handler({}, { config: { defaultModel: "gpt-image-2" } } as any);
    expect(res.content[0].text).toMatch(/gpt-image-2/);
    expect(res.content[0].text).toMatch(/2026-06/);
  });
});
