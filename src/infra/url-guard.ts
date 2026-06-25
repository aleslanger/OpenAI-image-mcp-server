export class UrlError extends Error {}

export function assertSafeUrl(raw: string): URL {
  let u: URL;
  try { u = new URL(raw); } catch { throw new UrlError(`invalid URL: ${raw}`); }
  if (u.protocol !== "http:" && u.protocol !== "https:")
    throw new UrlError(`only http/https allowed, got ${u.protocol}`);
  return u;
}

function isPrivateIpv4(ip: string): boolean {
  const v4 = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(ip);
  if (!v4) return false;
  const [a, b, c] = [Number(v4[1]), Number(v4[2]), Number(v4[3])];
  if (a === 0) return true; // 0.0.0.0/8 "this network"
  if (a === 127 || a === 10) return true; // loopback, private
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 192 && b === 0 && c === 0) return true; // 192.0.0.0/24 IETF protocol assignments
  if (a === 169 && b === 254) return true; // link-local
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  return false;
}

export function isPrivateIp(ip: string): boolean {
  const raw = ip.trim();
  if (isPrivateIpv4(raw)) return true;

  const lower = raw.toLowerCase();
  if (lower === "::" || lower === "::1") return true; // unspecified, loopback
  if (/^fe[89ab]/.test(lower)) return true; // link-local fe80::/10 (fe80–febf)
  if (/^f[cd]/.test(lower)) return true; // fc00::/7 ULA (first byte 0xfc/0xfd)

  // IPv4-mapped IPv6: ::ffff:a.b.c.d (dotted) or ::ffff:hhhh:hhhh (hex)
  const mappedDotted = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(lower);
  if (mappedDotted) return isPrivateIpv4(mappedDotted[1]);
  const mappedHex = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(lower);
  if (mappedHex) {
    const hi = parseInt(mappedHex[1], 16);
    const lo = parseInt(mappedHex[2], 16);
    const v4 = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
    return isPrivateIpv4(v4);
  }
  return false;
}
