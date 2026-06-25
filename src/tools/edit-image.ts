import { z } from "zod";
import type { ImageService } from "../services/image-service.js";
import { resolveInput } from "../infra/input-resolver.js";
import { validateMask } from "../infra/mask-validator.js";

export const name = "edit_image";
export const description = "Edit, extend, or compose images with a prompt and optional mask (gpt-image).";
export const schema = z.object({
  prompt: z.string().min(1),
  images: z.array(z.string().min(1)).min(1),
  mask: z.string().optional(),
  model: z.string().optional(),
  n: z.number().int().optional(),
  size: z.string().optional(),
  quality: z.enum(["low", "medium", "high", "auto"]).optional(),
  background: z.enum(["transparent", "opaque", "auto"]).optional(),
  input_fidelity: z.enum(["high", "low"]).optional(),
  output_format: z.enum(["png", "jpeg", "webp"]).optional(),
  output_compression: z.number().int().min(0).max(100).optional(),
  moderation: z.enum(["low", "auto"]).optional(),
  output: z.object({ mode: z.enum(["path", "base64", "both"]).optional(),
    dir: z.string().optional(), filename: z.string().optional() }).optional(),
  confirm: z.boolean().optional(),
});

export async function handler(args: any, ctx: { imageService: ImageService; config: { allowUrlInput: boolean } }) {
  const resolved = await Promise.all(args.images.map((i: string) =>
    resolveInput(i, { allowUrl: ctx.config.allowUrlInput })));
  const buffers: Buffer[] = [];
  for (const r of resolved) {
    if (r.kind !== "bytes") throw new Error("File ID image inputs are not supported in edit_image; use bytes/path");
    buffers.push(r.bytes);
  }
  let maskBuf: Buffer | undefined;
  if (args.mask) {
    const m = await resolveInput(args.mask, { allowUrl: ctx.config.allowUrlInput });
    if (m.kind !== "bytes") throw new Error("File ID mask not supported; use bytes/path");
    maskBuf = m.bytes;
    await validateMask(buffers[0], maskBuf);
  }
  const out = await ctx.imageService.edit({
    prompt: args.prompt, images: buffers, mask: maskBuf, model: args.model, n: args.n,
    size: args.size, quality: args.quality, background: args.background, inputFidelity: args.input_fidelity,
    outputFormat: args.output_format, outputCompression: args.output_compression,
    moderation: args.moderation, output: args.output, confirm: args.confirm });
  return { content: [{ type: "text" as const, text: JSON.stringify(out, null, 2) }] };
}
