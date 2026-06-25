import { describe, it, expect, vi } from "vitest";
import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { ResponsesService } from "../../src/services/responses-service.js";
import { SpendLog } from "../../src/infra/spend-log.js";

function deps(respResult: any) {
  return {
    client: { respond: vi.fn().mockResolvedValue(respResult) },
    spendLog: new SpendLog(undefined),
    config: { outputDir: mkdtempSync(path.join(os.tmpdir(), "rs-")),
      defaultOutputMode: "path", base64FallbackMaxBytes: 1048576, aiFilenames: true } as any,
    now: () => "t",
  };
}
const resp = { responseId: "resp_123", images: [{ b64: Buffer.from("X").toString("base64") }], revisedPrompt: "rp" };

describe("responses-service", () => {
  it("returns responseId for next turn + writes image", async () => {
    const d = deps(resp);
    const svc = new ResponsesService(d as any);
    const out = await svc.converse({ prompt: "make a logo", model: "gpt-image-2" });
    expect(out.responseId).toBe("resp_123");
    expect(out.results[0].path).toBeDefined();
  });

  it("passes previous_response_id through", async () => {
    const d = deps(resp);
    const svc = new ResponsesService(d as any);
    await svc.converse({ prompt: "make it blue", previousResponseId: "resp_prev" });
    const body = d.client.respond.mock.calls[0][0];
    expect(body.previous_response_id).toBe("resp_prev");
  });

  it("enforces the per-call budget guard before calling the API", async () => {
    const d = deps(resp);
    d.config.maxCostPerCallUsd = 0.0001; // below any real per-image estimate
    const svc = new ResponsesService(d as any);
    await expect(svc.converse({ prompt: "expensive", model: "gpt-image-2" }))
      .rejects.toThrow(/exceeds limit/);
    expect(d.client.respond).not.toHaveBeenCalled();
  });
});
