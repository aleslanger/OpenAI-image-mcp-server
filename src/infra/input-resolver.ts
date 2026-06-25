import { readFile, stat } from "node:fs/promises";
import { assertSafeUrl, isPrivateIp } from "./url-guard.js";

export class InputError extends Error {}
export type Resolved = { kind: "bytes"; bytes: Buffer } | { kind: "fileId"; id: string };

const MAX_INPUT_BYTES = 50 * 1024 * 1024; // 50 MB, matches mask cap

function assertSize(len: number): void {
  if (len > MAX_INPUT_BYTES)
    throw new InputError(`image input exceeds ${MAX_INPUT_BYTES} bytes`);
}

export async function resolveInput(
  input: string,
  opts: { allowUrl: boolean; fetchFn?: typeof fetch; lookupFn?: (host: string) => Promise<string | string[]> },
): Promise<Resolved> {
  if (input.startsWith("data:")) {
    const comma = input.indexOf(",");
    if (comma < 0) throw new InputError("malformed data URL");
    const bytes = Buffer.from(input.slice(comma + 1), "base64");
    assertSize(bytes.length);
    return { kind: "bytes", bytes };
  }
  if (/^file[-_][A-Za-z0-9]+$/.test(input)) {
    return { kind: "fileId", id: input };
  }
  if (/^https?:\/\//i.test(input)) {
    if (!opts.allowUrl) throw new InputError("URL input is disabled (set ALLOW_URL_INPUT=true)");
    const lookup = opts.lookupFn ?? defaultLookup;
    const f = opts.fetchFn ?? fetch;

    // Follow redirects manually, re-validating the host of every hop (scheme +
    // all resolved addresses). This closes the redirect-bypass vector; a small
    // TOCTOU window vs. the kernel connect remains (full mitigation needs an
    // IP-pinned agent/undici connect hook) but URL input is opt-in and off by
    // default, so we keep the dependency-free re-validation.
    let current = input;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const u = assertSafeUrl(current);
      const addrs = normalizeAddrs(await lookup(u.hostname));
      if (addrs.length === 0) throw new InputError(`URL host did not resolve: ${u.hostname}`);
      const bad = addrs.find(isPrivateIp);
      if (bad) throw new InputError(`URL resolves to private address: ${bad}`);

      const res = await f(u, { redirect: "manual" } as RequestInit);
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        if (!loc) throw new InputError("redirect without Location header");
        current = new URL(loc, u).toString();
        continue;
      }
      const bytes = Buffer.from(await res.arrayBuffer());
      assertSize(bytes.length);
      return { kind: "bytes", bytes };
    }
    throw new InputError(`too many redirects (>${MAX_REDIRECTS})`);
  }
  const st = await stat(input);
  assertSize(st.size);
  return { kind: "bytes", bytes: await readFile(input) };
}

const MAX_REDIRECTS = 5;

async function defaultLookup(host: string): Promise<string[]> {
  const dns = await import("node:dns/promises");
  const records = await dns.lookup(host, { all: true });
  return records.map((r) => r.address);
}

function normalizeAddrs(v: string | string[]): string[] {
  return Array.isArray(v) ? v : [v];
}
