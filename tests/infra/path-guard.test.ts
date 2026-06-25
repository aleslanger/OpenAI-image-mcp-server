import { describe, it, expect } from "vitest";
import path from "node:path";
import { resolveSafePath, PathError } from "../../src/infra/path-guard.js";

const root = "/var/img";

describe("path-guard", () => {
  it("resolves under root", () => {
    expect(resolveSafePath(root, undefined, "a.png")).toBe(path.join(root, "a.png"));
    expect(resolveSafePath(root, "sub", "a.png")).toBe(path.join(root, "sub", "a.png"));
  });

  it("rejects traversal", () => {
    expect(() => resolveSafePath(root, "../etc", "x.png")).toThrow(PathError);
    expect(() => resolveSafePath(root, undefined, "../../x.png")).toThrow(PathError);
  });

  it("rejects absolute escape", () => {
    expect(() => resolveSafePath(root, "/etc", "x.png")).toThrow(PathError);
  });

  it("rejects empty filename", () => {
    expect(() => resolveSafePath(root, undefined, "")).toThrow(PathError);
  });
});
