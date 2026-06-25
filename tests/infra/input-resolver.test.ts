import { describe, it, expect } from "vitest";
import { writeFileSync, mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { resolveInput, InputError } from "../../src/infra/input-resolver.js";

describe("input-resolver", () => {
  it("resolves local path to bytes", async () => {
    const f = path.join(mkdtempSync(path.join(os.tmpdir(), "ir-")), "a.png");
    writeFileSync(f, "XY");
    const r = await resolveInput(f, { allowUrl: false });
    expect(r.kind).toBe("bytes");
    if (r.kind === "bytes") expect(r.bytes.toString()).toBe("XY");
  });

  it("resolves data URL", async () => {
    const b64 = Buffer.from("hi").toString("base64");
    const r = await resolveInput(`data:image/png;base64,${b64}`, { allowUrl: false });
    expect(r.kind).toBe("bytes");
  });

  it("recognizes file id", async () => {
    const r = await resolveInput("file-abc123", { allowUrl: false });
    expect(r).toEqual({ kind: "fileId", id: "file-abc123" });
  });

  it("rejects url when disabled", async () => {
    await expect(resolveInput("https://x.com/a.png", { allowUrl: false }))
      .rejects.toThrow(/url input.*disabled/i);
  });

  it("rejects url resolving to private ip", async () => {
    await expect(resolveInput("https://internal.example/a.png", {
      allowUrl: true, lookupFn: async () => "10.0.0.5",
    })).rejects.toThrow(InputError);
  });

  it("fetches allowed public url", async () => {
    const r = await resolveInput("https://ok.example/a.png", {
      allowUrl: true,
      lookupFn: async () => "8.8.8.8",
      fetchFn: (async () => new Response(Buffer.from("PNG"), { status: 200 })) as any,
    });
    expect(r.kind).toBe("bytes");
  });

  it("rejects when ANY resolved address is private (all-IPs check)", async () => {
    await expect(resolveInput("https://multi.example/a.png", {
      allowUrl: true,
      lookupFn: async () => ["8.8.8.8", "10.0.0.5"], // one public, one private
      fetchFn: (async () => new Response(Buffer.from("PNG"), { status: 200 })) as any,
    })).rejects.toThrow(/private address/i);
  });

  it("re-validates the host on each redirect hop", async () => {
    const lookups: Record<string, string[]> = {
      "ok.example": ["8.8.8.8"],
      "internal.example": ["169.254.169.254"],
    };
    const fetchFn = (async (u: URL) => {
      if (u.hostname === "ok.example")
        return new Response(null, { status: 302, headers: { location: "https://internal.example/x" } });
      return new Response(Buffer.from("PNG"), { status: 200 });
    }) as any;
    await expect(resolveInput("https://ok.example/a.png", {
      allowUrl: true,
      lookupFn: async (h) => lookups[h] ?? [],
      fetchFn,
    })).rejects.toThrow(/private address/i);
  });

  it("follows a redirect to another public host", async () => {
    const lookups: Record<string, string[]> = {
      "ok.example": ["8.8.8.8"],
      "cdn.example": ["1.1.1.1"],
    };
    const fetchFn = (async (u: URL) => {
      if (u.hostname === "ok.example")
        return new Response(null, { status: 301, headers: { location: "https://cdn.example/x" } });
      return new Response(Buffer.from("PNG"), { status: 200 });
    }) as any;
    const r = await resolveInput("https://ok.example/a.png", {
      allowUrl: true, lookupFn: async (h) => lookups[h] ?? [], fetchFn,
    });
    expect(r.kind).toBe("bytes");
  });
});
