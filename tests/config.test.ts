import { describe, it, expect } from "vitest";
import { loadConfig } from "../src/config.js";

describe("loadConfig", () => {
  it("throws without api key", () => {
    expect(() => loadConfig({})).toThrow(/OPENAI_API_KEY/);
  });

  it("applies defaults", () => {
    const c = loadConfig({ OPENAI_API_KEY: "sk-x" });
    expect(c.apiKey).toBe("sk-x");
    expect(c.defaultModel).toBe("gpt-image-2");
    expect(c.defaultOutputMode).toBe("path");
    expect(c.base64FallbackMaxBytes).toBe(1048576);
    expect(c.allowUrlInput).toBe(false);
    expect(c.aiFilenames).toBe(true);
    expect(c.maxRetries).toBe(4);
    expect(c.maxImagesPerCall).toBe(10);
    expect(c.logLevel).toBe("info");
  });

  it("parses overrides and numbers", () => {
    const c = loadConfig({
      OPENAI_API_KEY: "sk-x",
      ALLOW_URL_INPUT: "true",
      MAX_IMAGES_PER_CALL: "5",
      MAX_COST_PER_CALL_USD: "0.50",
      CONFIRM_ABOVE_N: "3",
    });
    expect(c.allowUrlInput).toBe(true);
    expect(c.maxImagesPerCall).toBe(5);
    expect(c.maxCostPerCallUsd).toBe(0.5);
    expect(c.confirmAboveN).toBe(3);
  });
});
