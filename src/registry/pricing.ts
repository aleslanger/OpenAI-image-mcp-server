export const PRICING_AS_OF = "2026-06";

type Quality = "low" | "medium" | "high";

interface ModelPricing {
  perImage: Record<Quality, Record<string, number>>;
  tokens: { textIn: number; imageIn: number; imageOut: number };
}

const TABLE: Record<string, ModelPricing> = {
  "gpt-image-1": {
    perImage: {
      low:    { "1024x1024": 0.011, "1024x1536": 0.016, "1536x1024": 0.016 },
      medium: { "1024x1024": 0.042, "1024x1536": 0.063, "1536x1024": 0.063 },
      high:   { "1024x1024": 0.167, "1024x1536": 0.25,  "1536x1024": 0.25 },
    },
    tokens: { textIn: 5, imageIn: 10, imageOut: 40 },
  },
  "gpt-image-1-mini": {
    perImage: {
      low:    { "1024x1024": 0.003, "1024x1536": 0.004, "1536x1024": 0.004 },
      medium: { "1024x1024": 0.011, "1024x1536": 0.016, "1536x1024": 0.016 },
      high:   { "1024x1024": 0.042, "1024x1536": 0.063, "1536x1024": 0.063 },
    },
    tokens: { textIn: 5, imageIn: 2.5, imageOut: 10 },
  },
  "gpt-image-2": {
    perImage: {
      low:    { "1024x1024": 0.013, "1536x1024": 0.011, "1024x1536": 0.011 },
      medium: { "1024x1024": 0.053, "1536x1024": 0.041, "1024x1536": 0.041 },
      high:   { "1024x1024": 0.211, "1536x1024": 0.165, "1024x1536": 0.165 },
    },
    tokens: { textIn: 5, imageIn: 8, imageOut: 30 },
  },
};

function model(m: string): ModelPricing {
  const p = TABLE[m];
  if (!p) throw new Error(`unknown model: ${m}`);
  return p;
}

export function getImagePrice(m: string, quality: Quality, size: string): number {
  const tier = model(m).perImage[quality];
  if (size in tier) return tier[size];
  return Math.max(...Object.values(tier)); // conservative upper bound
}

export function getTokenRates(m: string) {
  return model(m).tokens;
}
