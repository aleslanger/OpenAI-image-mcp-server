import { describe, it, expect } from "vitest";
import { buildServer } from "../src/server.js";

describe("server", () => {
  it("builds with all 4 tools registered without network", () => {
    const cfg = {
      apiKey: "sk-test", outputDir: "/tmp", defaultModel: "gpt-image-2",
      defaultOutputMode: "path", base64FallbackMaxBytes: 1048576, aiFilenames: true,
      promptEnhance: false, maxRetries: 0, requestTimeoutMs: 1000, maxImagesPerCall: 10,
      allowUrlInput: false, logLevel: "error",
    } as any;
    const { ctx, toolNames } = buildServer(cfg);
    expect(ctx.imageService).toBeDefined();
    expect(ctx.responsesService).toBeDefined();
    expect(toolNames.sort()).toEqual(
      ["edit_image", "edit_image_conversation", "generate_image", "image_capabilities"]);
  });
});
