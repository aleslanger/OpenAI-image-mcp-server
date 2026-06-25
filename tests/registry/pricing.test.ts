import { describe, it, expect } from "vitest";
import { PRICING_AS_OF, getImagePrice, getTokenRates } from "../../src/registry/pricing.js";

describe("pricing", () => {
  it("has as-of date", () => {
    expect(PRICING_AS_OF).toBe("2026-06");
  });

  it("returns gpt-image-1 per-image prices", () => {
    expect(getImagePrice("gpt-image-1", "low", "1024x1024")).toBeCloseTo(0.011);
    expect(getImagePrice("gpt-image-1", "high", "1024x1024")).toBeCloseTo(0.167);
  });

  it("uses conservative upper price for unknown size", () => {
    const known = getImagePrice("gpt-image-1", "high", "1024x1536"); // 0.25
    expect(getImagePrice("gpt-image-1", "high", "9999x9999")).toBe(known);
  });

  it("returns token rates", () => {
    expect(getTokenRates("gpt-image-1").imageOut).toBe(40);
    expect(getTokenRates("gpt-image-2").imageOut).toBe(30);
  });

  it("throws for unknown model", () => {
    expect(() => getTokenRates("nope")).toThrow(/unknown model/i);
  });
});
