import { describe, it, expect } from "vitest";
import { mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { SpendLog } from "../../src/infra/spend-log.js";

describe("spend-log", () => {
  it("appends JSONL serially", async () => {
    const f = path.join(mkdtempSync(path.join(os.tmpdir(), "sl-")), "spend.jsonl");
    const log = new SpendLog(f);
    await Promise.all([
      log.append({ ts: "t1", model: "gpt-image-2", n: 1, estimateUsd: 0.05 }),
      log.append({ ts: "t2", model: "gpt-image-2", n: 2, estimateUsd: 0.10 }),
    ]);
    const lines = readFileSync(f, "utf8").trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]).model).toBe("gpt-image-2");
  });

  it("no-op without path", async () => {
    const log = new SpendLog(undefined);
    await expect(log.append({ ts: "t", model: "m", n: 1, estimateUsd: 0 })).resolves.toBeUndefined();
  });
});
