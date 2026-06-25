import { describe, it, expect } from "vitest";
import { mapOpenAiError } from "../../src/infra/error-mapper.js";

describe("error-mapper", () => {
  it("maps moderation_blocked with details", () => {
    const r = mapOpenAiError({ status: 400, code: "moderation_blocked",
      error: { code: "moderation_blocked", moderation_details: { moderation_stage: "input", categories: ["violence"] } } });
    expect(r.message).toMatch(/moderation/i);
    expect(r.message).toMatch(/input/);
    expect(r.message).toMatch(/violence/);
  });

  it("maps 403 verification", () => {
    const r = mapOpenAiError({ status: 403, message: "organization must be verified" });
    expect(r.message).toMatch(/verif/i);
    expect(r.message).toMatch(/platform.openai.com/);
  });

  it("maps 429 with retry-after", () => {
    const r = mapOpenAiError({ status: 429, headers: { "retry-after": "12" }, message: "rate limit" });
    expect(r.retryAfter).toBe(12);
    expect(r.message).toMatch(/rate limit/i);
  });

  it("maps expired previous_response_id", () => {
    const r = mapOpenAiError({ status: 404, message: "Previous response not found" });
    expect(r.message).toMatch(/expired|30/i);
  });

  it("falls back for unknown", () => {
    const r = mapOpenAiError(new Error("weird"));
    expect(r.message).toMatch(/weird/);
  });
});
