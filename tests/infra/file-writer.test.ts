import { describe, it, expect } from "vitest";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { writeImage, slugifyPrompt } from "../../src/infra/file-writer.js";

describe("file-writer", () => {
  it("writes and returns path under root", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "fw-"));
    const p = await writeImage({ rootDir: root, filename: "x.png", bytes: Buffer.from("AB") });
    expect(p).toBe(path.join(root, "x.png"));
    expect(readFileSync(p).toString()).toBe("AB");
  });

  it("never overwrites — adds suffix", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "fw-"));
    const a = await writeImage({ rootDir: root, filename: "x.png", bytes: Buffer.from("1") });
    const b = await writeImage({ rootDir: root, filename: "x.png", bytes: Buffer.from("2") });
    expect(a).not.toBe(b);
    expect(b.endsWith("x-1.png")).toBe(true);
    expect(existsSync(a) && existsSync(b)).toBe(true);
  });

  it("slugifies prompt to safe basename", () => {
    expect(slugifyPrompt("Cat playing FOOTBALL!")).toBe("cat-playing-football");
  });
});
