import { z } from "zod";
import type { ResponsesService } from "../services/responses-service.js";

export const name = "edit_image_conversation";
export const description = "Multi-turn iterative image editing via the Responses API (stateful by previous_response_id).";
export const schema = z.object({
  prompt: z.string().min(1),
  model: z.string().optional(),
  previous_response_id: z.string().optional(),
  action: z.enum(["auto", "generate", "edit"]).optional(),
  input_image_mask: z.string().optional(),
  partial_images: z.number().int().min(0).max(3).optional(),
  output: z.object({ mode: z.enum(["path", "base64", "both"]).optional(),
    dir: z.string().optional(), filename: z.string().optional() }).optional(),
});

export async function handler(args: any, ctx: { responsesService: ResponsesService }) {
  const out = await ctx.responsesService.converse({
    prompt: args.prompt, model: args.model, previousResponseId: args.previous_response_id,
    action: args.action, inputImageMask: args.input_image_mask, partialImages: args.partial_images,
    output: args.output });
  return { content: [{ type: "text" as const, text: JSON.stringify(out, null, 2) }] };
}
