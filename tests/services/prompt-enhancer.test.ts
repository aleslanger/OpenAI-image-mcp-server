import { describe, it, expect } from "vitest";
import { enhancePrompt } from "../../src/services/prompt-enhancer.js";

describe("prompt-enhancer", () => {
  it("returns unchanged when disabled", () => {
    expect(enhancePrompt("a cat", false)).toBe("a cat");
  });

  it("appends template when enabled and short", () => {
    const out = enhancePrompt("a cat", true);
    expect(out.startsWith("a cat")).toBe(true);
    expect(out.length).toBeGreaterThan("a cat".length);
    expect(out).toMatch(/lighting|composition/i);
  });

  it("leaves long prompts alone even when enabled", () => {
    const long = "x".repeat(200);
    expect(enhancePrompt(long, true)).toBe(long);
  });
});
