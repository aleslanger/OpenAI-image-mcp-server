import { describe, it, expect } from "vitest";
import { MODELS, getModel } from "../../src/registry/model-registry.js";
import { getTokenRates } from "../../src/registry/pricing.js";

describe("model-registry", () => {
  it("has gpt-image family only, no dall-e", () => {
    expect(Object.keys(MODELS).sort()).toEqual(
      ["gpt-image-1", "gpt-image-1-mini", "gpt-image-2"]
    );
  });

  it("gpt-image-2 lacks transparent + input_fidelity", () => {
    const m = getModel("gpt-image-2");
    expect(m.supportsTransparent).toBe(false);
    expect(m.supportsInputFidelity).toBe(false);
  });

  it("gpt-image-1 supports transparent + input_fidelity", () => {
    const m = getModel("gpt-image-1");
    expect(m.supportsTransparent).toBe(true);
    expect(m.supportsInputFidelity).toBe(true);
  });

  it("throws for unknown model", () => {
    expect(() => getModel("nope")).toThrow(/unknown/i);
  });

  it("every model has pricing (sanity)", () => {
    for (const id of Object.keys(MODELS)) {
      expect(() => getTokenRates(id)).not.toThrow();
    }
  });
});
