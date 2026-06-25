import type { OpenAiClient, ImageResult } from "../infra/openai-client.js";
import type { SpendLog } from "../infra/spend-log.js";
import { validateParams } from "../registry/param-validator.js";
import { getModel } from "../registry/model-registry.js";
import { estimateCost, actualCost, assertWithinBudget } from "./cost-service.js";
import { enhancePrompt } from "./prompt-enhancer.js";
import { writeImage, slugifyPrompt } from "../infra/file-writer.js";

type Quality = "low" | "medium" | "high" | "auto";
export interface OutputSpec { mode?: "path" | "base64" | "both"; dir?: string; filename?: string }
export interface GenerateArgs {
  prompt: string; model?: string; n?: number; size?: string; quality?: Quality;
  background?: string; outputFormat?: string; outputCompression?: number;
  moderation?: string; output?: OutputSpec; confirm?: boolean;
}
export interface EditArgs extends GenerateArgs { images: Buffer[]; mask?: Buffer; inputFidelity?: string }
export interface ImageOutput {
  results: { path?: string; b64?: string; base64Omitted?: boolean }[];
  revisedPrompt?: string; estimateUsd: number; actualUsd?: number; model: string; size: string;
}

interface Deps {
  client: Pick<OpenAiClient, "generate" | "edit">;
  spendLog: SpendLog;
  config: {
    outputDir: string; defaultOutputMode: "path" | "base64" | "both";
    base64FallbackMaxBytes: number; aiFilenames: boolean; promptEnhance: boolean;
    maxImagesPerCall: number; maxCostPerCallUsd?: number; confirmAboveN?: number;
  };
  now: () => string;
}

export class ImageService {
  constructor(private d: Deps) {}

  private resolveModelSize(args: GenerateArgs) {
    const model = args.model ?? "gpt-image-2";
    const size = args.size ?? "1024x1024";
    const quality: Quality = (args.quality ?? "medium") as Quality;
    return { model, size, quality };
  }

  private effectiveN(model: string, n: number): number {
    const caps = getModel(model);
    return Math.min(n, caps.maxN, this.d.config.maxImagesPerCall);
  }

  private async emit(images: { b64: string }[], prompt: string, output: OutputSpec | undefined) {
    const mode = output?.mode ?? this.d.config.defaultOutputMode;
    const out: ImageOutput["results"] = [];
    let idx = 0;
    for (const img of images) {
      idx++;
      const bytes = Buffer.from(img.b64, "base64");
      const tooBig = bytes.length > this.d.config.base64FallbackMaxBytes;
      const wantPath = mode === "path" || mode === "both";
      const wantB64 = mode === "base64" || mode === "both";
      const base = this.d.config.aiFilenames ? slugifyPrompt(prompt) : "image";
      const filename = output?.filename ?? `${base}-${idx}.png`;
      const res: ImageOutput["results"][number] = {};
      if (wantPath || (wantB64 && tooBig)) {
        res.path = await writeImage({ rootDir: this.d.config.outputDir, dir: output?.dir, filename, bytes });
      }
      if (wantB64) {
        if (tooBig) res.base64Omitted = true;
        else res.b64 = img.b64;
      }
      out.push(res);
    }
    return out;
  }

  private guard(model: string, quality: Quality, size: string, n: number, confirm?: boolean) {
    if (this.d.config.confirmAboveN !== undefined && n > this.d.config.confirmAboveN && !confirm)
      throw new Error(`n=${n} exceeds CONFIRM_ABOVE_N=${this.d.config.confirmAboveN}; pass confirm:true`);
    const est = estimateCost({ model, quality, size, n });
    assertWithinBudget(est, this.d.config.maxCostPerCallUsd);
    return est;
  }

  async generate(args: GenerateArgs): Promise<ImageOutput> {
    const { model, size, quality } = this.resolveModelSize(args);
    const prompt = enhancePrompt(args.prompt, this.d.config.promptEnhance);
    const n = this.effectiveN(model, args.n ?? 1);
    validateParams({ model, size, quality, background: args.background, n,
      outputFormat: args.outputFormat, outputCompression: args.outputCompression });
    const est = this.guard(model, quality, size, n, args.confirm);
    const r: ImageResult = await this.d.client.generate({
      model, prompt, n, size, quality, background: args.background,
      output_format: args.outputFormat ?? "png", output_compression: args.outputCompression,
      moderation: args.moderation });
    const results = await this.emit(r.images, prompt, args.output);
    const act = r.usage ? actualCost({ model, usage: r.usage as any }) : undefined;
    await this.d.spendLog.append({ ts: this.d.now(), model, n, tokens: r.usage, estimateUsd: est, actualUsd: act });
    return { results, revisedPrompt: r.revisedPrompt, estimateUsd: est, actualUsd: act, model, size };
  }

  async edit(args: EditArgs): Promise<ImageOutput> {
    const { model, size, quality } = this.resolveModelSize(args);
    const prompt = enhancePrompt(args.prompt, this.d.config.promptEnhance);
    const n = this.effectiveN(model, args.n ?? 1);
    validateParams({ model, size, quality, background: args.background, n,
      inputFidelity: args.inputFidelity, outputFormat: args.outputFormat, outputCompression: args.outputCompression });
    const est = this.guard(model, quality, size, n, args.confirm);
    const r: ImageResult = await this.d.client.edit({
      model, prompt, n, size, quality, image: args.images, mask: args.mask,
      input_fidelity: args.inputFidelity, background: args.background,
      output_format: args.outputFormat ?? "png", output_compression: args.outputCompression,
      moderation: args.moderation });
    const results = await this.emit(r.images, prompt, args.output);
    const act = r.usage ? actualCost({ model, usage: r.usage as any }) : undefined;
    await this.d.spendLog.append({ ts: this.d.now(), model, n, tokens: r.usage, estimateUsd: est, actualUsd: act });
    return { results, revisedPrompt: r.revisedPrompt, estimateUsd: est, actualUsd: act, model, size };
  }
}
