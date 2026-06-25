import { describe, it, expect } from "vitest";
import { estimateCost, actualCost, assertWithinBudget, CostError } from "../../src/services/cost-service.js";

describe("cost-service", () => {
  it("estimates per-image times n", () => {
    const c = estimateCost({ model: "gpt-image-1", quality: "high", size: "1024x1024", n: 3 });
    expect(c).toBeCloseTo(0.167 * 3);
  });

  it("estimate is conservative for unknown size", () => {
    const c = estimateCost({ model: "gpt-image-1", quality: "high", size: "9999x9999", n: 1 });
    expect(c).toBeCloseTo(0.25); // most expensive known
  });

  it("treats quality 'auto' as the conservative high tier", () => {
    const high = estimateCost({ model: "gpt-image-1", quality: "high", size: "1024x1024", n: 1 });
    const auto = estimateCost({ model: "gpt-image-1", quality: "auto", size: "1024x1024", n: 1 });
    expect(auto).toBeCloseTo(high);
  });

  it("computes actual from token usage", () => {
    const c = actualCost({ model: "gpt-image-1",
      usage: { input_tokens: 1_000_000, output_tokens: 1_000_000,
               input_tokens_details: { image_tokens: 0, text_tokens: 1_000_000 } } });
    // 1M text-in @ $5 + 1M image-out @ $40 = 45
    expect(c).toBeCloseTo(45, 0);
  });

  it("budget guard throws when over limit", () => {
    expect(() => assertWithinBudget(0.6, 0.5)).toThrow(CostError);
  });

  it("budget guard passes without limit", () => {
    expect(() => assertWithinBudget(99, undefined)).not.toThrow();
  });
});
