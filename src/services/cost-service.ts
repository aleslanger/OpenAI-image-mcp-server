import { getImagePrice, getTokenRates } from "../registry/pricing.js";

export class CostError extends Error {}

export function estimateCost(a: { model: string; quality: "low"|"medium"|"high"|"auto"; size: string; n: number }): number {
  // 'auto' lets the API pick a tier; estimate conservatively at the high tier.
  const tier = a.quality === "auto" ? "high" : a.quality;
  return getImagePrice(a.model, tier, a.size) * a.n;
}

export function actualCost(a: {
  model: string;
  usage: { input_tokens?: number; output_tokens?: number;
           input_tokens_details?: { image_tokens?: number; text_tokens?: number } };
}): number {
  const r = getTokenRates(a.model);
  const u = a.usage;
  const textIn = u.input_tokens_details?.text_tokens ?? u.input_tokens ?? 0;
  const imageIn = u.input_tokens_details?.image_tokens ?? 0;
  const imageOut = u.output_tokens ?? 0;
  return (textIn * r.textIn + imageIn * r.imageIn + imageOut * r.imageOut) / 1_000_000;
}

export function assertWithinBudget(estimate: number, limit?: number): void {
  if (limit !== undefined && estimate > limit)
    throw new CostError(`estimated cost $${estimate.toFixed(3)} exceeds limit $${limit.toFixed(3)}`);
}
