import { describe, it, expect, vi } from "vitest";
import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { ImageService } from "../../src/services/image-service.js";
import { SpendLog } from "../../src/infra/spend-log.js";

function deps(genResult: any) {
  return {
    client: { generate: vi.fn().mockResolvedValue(genResult), edit: vi.fn().mockResolvedValue(genResult) },
    spendLog: new SpendLog(undefined),
    config: {
      outputDir: mkdtempSync(path.join(os.tmpdir(), "is-")),
      defaultOutputMode: "path", base64FallbackMaxBytes: 1048576,
      aiFilenames: true, promptEnhance: false, maxImagesPerCall: 10,
      maxCostPerCallUsd: undefined, confirmAboveN: undefined,
    } as any,
    now: () => "2026-06-23T00:00:00Z",
  };
}

const oneImage = { images: [{ b64: Buffer.from("PNGDATA").toString("base64") }], usage: {}, revisedPrompt: "rp" };

describe("image-service generate", () => {
  it("writes file in path mode and returns path", async () => {
    const d = deps(oneImage);
    const svc = new ImageService(d as any);
    const out = await svc.generate({ prompt: "a cat", model: "gpt-image-2", quality: "high", size: "1024x1024" });
    expect(out.results[0].path).toBeDefined();
    expect(out.results[0].b64).toBeUndefined();
    expect(out.revisedPrompt).toBe("rp");
    expect(out.estimateUsd).toBeGreaterThan(0);
  });

  it("rejects when estimate exceeds budget", async () => {
    const d = deps(oneImage); d.config.maxCostPerCallUsd = 0.0001;
    const svc = new ImageService(d as any);
    await expect(svc.generate({ prompt: "x", model: "gpt-image-2", quality: "high", size: "1024x1024" }))
      .rejects.toThrow(/exceeds limit/);
  });

  it("requires confirm above N", async () => {
    const d = deps(oneImage); d.config.confirmAboveN = 1;
    const svc = new ImageService(d as any);
    await expect(svc.generate({ prompt: "x", model: "gpt-image-2", quality: "low", size: "1024x1024", n: 2 }))
      .rejects.toThrow(/confirm/i);
  });

  it("base64 mode over fallback limit writes file + flags omitted", async () => {
    const big = { images: [{ b64: Buffer.alloc(2_000_000).toString("base64") }], usage: {} };
    const d = deps(big); d.config.defaultOutputMode = "base64";
    const svc = new ImageService(d as any);
    const out = await svc.generate({ prompt: "x", model: "gpt-image-2", quality: "low", size: "1024x1024",
      output: { mode: "base64" } });
    expect(out.results[0].base64Omitted).toBe(true);
    expect(out.results[0].path).toBeDefined();
  });
});
