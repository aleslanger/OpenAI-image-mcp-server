import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { resolveSafePath } from "./path-guard.js";

export function slugifyPrompt(prompt: string, max = 40): string {
  const s = prompt.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return (s || "image").slice(0, max).replace(/-+$/g, "");
}

export async function writeImage(opts: {
  rootDir: string; dir?: string; filename: string; bytes: Buffer;
}): Promise<string> {
  let target = resolveSafePath(opts.rootDir, opts.dir, opts.filename);
  const ext = path.extname(target);
  const base = target.slice(0, target.length - ext.length);
  let i = 0;
  while (existsSync(target)) { i++; target = `${base}-${i}${ext}`; }
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, opts.bytes);
  return target;
}
