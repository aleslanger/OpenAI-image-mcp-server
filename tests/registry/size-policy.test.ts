import { describe, it, expect } from "vitest";
import { validateSize } from "../../src/registry/size-policy.js";
import { getModel } from "../../src/registry/model-registry.js";

const g1 = getModel("gpt-image-1");
const g2 = getModel("gpt-image-2");

describe("size-policy", () => {
  it("accepts auto + presets", () => {
    expect(validateSize(g1, "auto").ok).toBe(true);
    expect(validateSize(g1, "1024x1024").ok).toBe(true);
  });

  it("rejects custom size on model without custom support", () => {
    const r = validateSize(g1, "1040x1040");
    expect(r.ok).toBe(false);
  });

  it("accepts valid custom size on gpt-image-2", () => {
    expect(validateSize(g2, "1024x1024").ok).toBe(true);
    expect(validateSize(g2, "2048x1024").ok).toBe(true);
  });

  it("rejects non-divisible-by-16", () => {
    const r = validateSize(g2, "1000x1024");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/16/);
  });

  it("rejects ratio over 3:1", () => {
    const r = validateSize(g2, "3840x1024"); // 3.75:1
    expect(r.ok).toBe(false);
  });

  it("rejects edge over 3840", () => {
    expect(validateSize(g2, "3856x1024").ok).toBe(false);
  });
});
