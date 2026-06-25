import { z } from "zod";
import type { ImageService } from "../services/image-service.js";

export const name = "generate_image";
export const description = "Generate image(s) from a text prompt using OpenAI gpt-image models.";
export const schema = z.object({
  prompt: z.string().min(1),
  model: z.string().optional(),
  n: z.number().int().optional(),
  size: z.string().optional(),
  quality: z.enum(["low", "medium", "high", "auto"]).optional(),
  background: z.enum(["transparent", "opaque", "auto"]).optional(),
  output_format: z.enum(["png", "jpeg", "webp"]).optional(),
  output_compression: z.number().int().min(0).max(100).optional(),
  moderation: z.enum(["low", "auto"]).optional(),
  output: z.object({ mode: z.enum(["path", "base64", "both"]).optional(),
    dir: z.string().optional(), filename: z.string().optional() }).optional(),
  confirm: z.boolean().optional(),
});

export async function handler(args: any, ctx: { imageService: ImageService }) {
  const out = await ctx.imageService.generate({
    prompt: args.prompt, model: args.model, n: args.n, size: args.size, quality: args.quality,
    background: args.background, outputFormat: args.output_format, outputCompression: args.output_compression,
    moderation: args.moderation, output: args.output, confirm: args.confirm });
  return { content: [{ type: "text" as const, text: JSON.stringify(out, null, 2) }] };
}
