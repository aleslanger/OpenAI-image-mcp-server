import { getModel } from "./model-registry.js";
import { validateSize } from "./size-policy.js";

export class ParamError extends Error {}

export interface ValidatedParams {
  model: string;
  size?: string;
  quality?: string;
  background?: string;
  n?: number;
  inputFidelity?: string;
  outputFormat?: string;
  outputCompression?: number;
}

export function validateParams(p: ValidatedParams): void {
  const caps = getModel(p.model);

  if (p.size) {
    const r = validateSize(caps, p.size);
    if (!r.ok) throw new ParamError(r.reason);
  }
  if (p.quality && !caps.qualities.includes(p.quality as any))
    throw new ParamError(`quality '${p.quality}' not allowed for ${caps.id}`);
  if (p.background === "transparent" && !caps.supportsTransparent)
    throw new ParamError(`${caps.id} does not support transparent background`);
  if (p.inputFidelity && !caps.supportsInputFidelity)
    throw new ParamError(`${caps.id} ignores input_fidelity (always high)`);
  if (p.n !== undefined && (p.n < 1 || p.n > caps.maxN))
    throw new ParamError(`n must be 1..${caps.maxN} for ${caps.id}`);
  if (p.outputCompression !== undefined &&
      p.outputFormat !== "jpeg" && p.outputFormat !== "webp")
    throw new ParamError(`output_compression requires jpeg or webp`);
}
