import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, it, expect } from "vitest";
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

describe("loadConfig with OPENAI_API_KEY_FILE", () => {
  let dir: string | undefined;

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
    dir = undefined;
  });

  const writeKeyFile = (content: string): string => {
    dir = mkdtempSync(join(tmpdir(), "openai-image-mcp-test-"));
    const file = join(dir, "api_key");
    writeFileSync(file, content, { mode: 0o600 });
    return file;
  };

  it("reads api key from file", () => {
    const file = writeKeyFile("sk-from-file\n");
    const c = loadConfig({ OPENAI_API_KEY_FILE: file });
    expect(c.apiKey).toBe("sk-from-file");
  });

  it("prefers OPENAI_API_KEY over file", () => {
    const file = writeKeyFile("sk-from-file");
    const c = loadConfig({ OPENAI_API_KEY: "sk-direct", OPENAI_API_KEY_FILE: file });
    expect(c.apiKey).toBe("sk-direct");
  });

  it("trims direct OPENAI_API_KEY and falls back to file when it is blank", () => {
    const file = writeKeyFile("sk-from-file");
    expect(loadConfig({ OPENAI_API_KEY: " sk-direct \n" }).apiKey).toBe("sk-direct");
    expect(
      loadConfig({ OPENAI_API_KEY: "   ", OPENAI_API_KEY_FILE: file }).apiKey,
    ).toBe("sk-from-file");
  });

  it("throws when key file is missing", () => {
    expect(() =>
      loadConfig({ OPENAI_API_KEY_FILE: "/nonexistent/api_key" }),
    ).toThrow(/OPENAI_API_KEY_FILE/);
  });

  it("throws when key file is empty", () => {
    const file = writeKeyFile("   \n");
    expect(() => loadConfig({ OPENAI_API_KEY_FILE: file })).toThrow(
      /OPENAI_API_KEY_FILE/,
    );
  });
});
