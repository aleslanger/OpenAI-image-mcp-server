const TEMPLATE = ", with balanced composition, considered lighting, and clear focal point";

export function enhancePrompt(prompt: string, enabled: boolean): string {
  if (!enabled) return prompt;
  if (prompt.length >= 120) return prompt;
  return prompt + TEMPLATE;
}
