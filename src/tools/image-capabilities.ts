import { z } from "zod";
import { MODELS } from "../registry/model-registry.js";
import { PRICING_AS_OF } from "../registry/pricing.js";

export const name = "image_capabilities";
export const description = "Discover available models, allowed params, size/quality limits, pricing as-of date, and defaults.";
export const schema = z.object({});

export async function handler(_args: any, ctx: { config: { defaultModel: string } }) {
  const payload = { models: MODELS, pricingAsOf: PRICING_AS_OF, defaultModel: ctx.config.defaultModel,
    note: "verification/tier status not queried; learned best-effort from last call errors." };
  return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
}
