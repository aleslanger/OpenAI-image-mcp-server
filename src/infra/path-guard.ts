import path from "node:path";

export class PathError extends Error {}

export function resolveSafePath(rootDir: string, dir: string | undefined, filename: string): string {
  if (!filename || filename.trim() === "") throw new PathError("filename is empty");
  const root = path.resolve(rootDir);
  const target = path.resolve(root, dir ?? ".", filename);
  const rel = path.relative(root, target);
  if (rel.startsWith("..") || path.isAbsolute(rel))
    throw new PathError(`path escapes output dir: ${dir ?? ""}/${filename}`);
  return target;
}
