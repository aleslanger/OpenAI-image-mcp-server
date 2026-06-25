import { describe, it, expect, vi } from "vitest";
import { OpenAiClient } from "../../src/infra/openai-client.js";
import { RateLimiter } from "../../src/infra/rate-limiter.js";

function fakeSdk(overrides: any = {}) {
  return {
    images: {
      generate: overrides.generate ?? vi.fn().mockResolvedValue({
        data: [{ b64_json: "AAAA" }], usage: { output_tokens: 10 },
      }),
      edit: overrides.edit ?? vi.fn(),
    },
    responses: { create: overrides.respond ?? vi.fn() },
    files: { create: overrides.file ?? vi.fn() },
  };
}

describe("openai-client", () => {
  it("generate returns normalized images + usage", async () => {
    const sdk = fakeSdk();
    const c = new OpenAiClient({ sdk: sdk as any, limiter: new RateLimiter({}), maxRetries: 0 });
    const r = await c.generate({ model: "gpt-image-2", prompt: "x" });
    expect(r.images[0].b64).toBe("AAAA");
    expect(r.usage).toEqual({ output_tokens: 10 });
  });

  it("retries on 429 then succeeds", async () => {
    const gen = vi.fn()
      .mockRejectedValueOnce({ status: 429, headers: { "retry-after": "0" }, message: "rate" })
      .mockResolvedValueOnce({ data: [{ b64_json: "OK" }] });
    const sdk = fakeSdk({ generate: gen });
    const c = new OpenAiClient({ sdk: sdk as any, limiter: new RateLimiter({}), maxRetries: 2 });
    const r = await c.generate({ model: "gpt-image-2", prompt: "x" });
    expect(r.images[0].b64).toBe("OK");
    expect(gen).toHaveBeenCalledTimes(2);
  });

  it("throws mapped error after retries exhausted", async () => {
    const gen = vi.fn().mockRejectedValue({ status: 403, message: "must be verified" });
    const sdk = fakeSdk({ generate: gen });
    const c = new OpenAiClient({ sdk: sdk as any, limiter: new RateLimiter({}), maxRetries: 1 });
    await expect(c.generate({ model: "gpt-image-2", prompt: "x" })).rejects.toThrow(/verif/i);
  });
});
