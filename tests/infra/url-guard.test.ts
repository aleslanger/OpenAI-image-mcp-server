import { describe, it, expect } from "vitest";
import { assertSafeUrl, isPrivateIp, UrlError } from "../../src/infra/url-guard.js";

describe("url-guard", () => {
  it("accepts https", () => {
    expect(assertSafeUrl("https://example.com/a.png").host).toBe("example.com");
  });

  it("rejects non-http schemes", () => {
    expect(() => assertSafeUrl("file:///etc/passwd")).toThrow(UrlError);
    expect(() => assertSafeUrl("ftp://x/y")).toThrow(UrlError);
  });

  it("flags private + loopback + link-local ipv4", () => {
    expect(isPrivateIp("127.0.0.1")).toBe(true);
    expect(isPrivateIp("10.1.2.3")).toBe(true);
    expect(isPrivateIp("172.16.0.1")).toBe(true);
    expect(isPrivateIp("192.168.1.1")).toBe(true);
    expect(isPrivateIp("169.254.169.254")).toBe(true);
    expect(isPrivateIp("8.8.8.8")).toBe(false);
  });

  it("flags ipv6 loopback + ula", () => {
    expect(isPrivateIp("::1")).toBe(true);
    expect(isPrivateIp("fc00::1")).toBe(true);
    expect(isPrivateIp("2001:4860:4860::8888")).toBe(false);
  });

  it("flags additional ipv4 ranges (0.0.0.0/8, CGNAT, 192.0.0.0/24)", () => {
    expect(isPrivateIp("0.0.0.0")).toBe(true);
    expect(isPrivateIp("0.1.2.3")).toBe(true);
    expect(isPrivateIp("100.64.0.1")).toBe(true);
    expect(isPrivateIp("100.127.255.255")).toBe(true);
    expect(isPrivateIp("100.63.0.1")).toBe(false); // just below CGNAT
    expect(isPrivateIp("100.128.0.1")).toBe(false); // just above CGNAT
    expect(isPrivateIp("192.0.0.1")).toBe(true);
    expect(isPrivateIp("192.0.1.1")).toBe(false);
  });

  it("flags ipv4-mapped ipv6 by decoding the embedded v4", () => {
    expect(isPrivateIp("::ffff:127.0.0.1")).toBe(true);
    expect(isPrivateIp("::ffff:10.0.0.1")).toBe(true);
    expect(isPrivateIp("::ffff:169.254.169.254")).toBe(true);
    expect(isPrivateIp("::ffff:8.8.8.8")).toBe(false);
    expect(isPrivateIp("::ffff:7f00:1")).toBe(true); // hex form of 127.0.0.1
  });

  it("flags unspecified ipv6 and is case/whitespace tolerant", () => {
    expect(isPrivateIp("::")).toBe(true);
    expect(isPrivateIp(" ::1 ")).toBe(true);
    expect(isPrivateIp("FC00::1")).toBe(true);
    expect(isPrivateIp("FE80::1")).toBe(true);
  });
});
