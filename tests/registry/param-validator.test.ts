import { describe, it, expect } from "vitest";
import { validateParams, ParamError } from "../../src/registry/param-validator.js";

describe("param-validator", () => {
  it("accepts a legal combo", () => {
    expect(() => validateParams({ model: "gpt-image-2", size: "1024x1024", quality: "high" })).not.toThrow();
  });

  it("rejects transparent on gpt-image-2", () => {
    expect(() => validateParams({ model: "gpt-image-2", background: "transparent" }))
      .toThrow(ParamError);
  });

  it("rejects input_fidelity on gpt-image-2", () => {
    expect(() => validateParams({ model: "gpt-image-2", inputFidelity: "high" }))
      .toThrow(/input_fidelity/i);
  });

  it("rejects compression without jpeg/webp", () => {
    expect(() => validateParams({ model: "gpt-image-1", outputFormat: "png", outputCompression: 50 }))
      .toThrow(/compression/i);
  });

  it("rejects n above model max", () => {
    expect(() => validateParams({ model: "gpt-image-1", n: 99 })).toThrow(/n/i);
  });

  it("rejects invalid size", () => {
    expect(() => validateParams({ model: "gpt-image-1", size: "1000x1000" })).toThrow();
  });
});
