import type { OpenAiClient } from "../infra/openai-client.js";
import type { SpendLog } from "../infra/spend-log.js";
import { writeImage, slugifyPrompt } from "../infra/file-writer.js";
import type { OutputSpec } from "./image-service.js";
import { estimateCost, actualCost, assertWithinBudget } from "./cost-service.js";

export interface ConverseArgs {
  prompt: string; model?: string; previousResponseId?: string;
  action?: "auto" | "generate" | "edit"; inputImageMask?: string;
  partialImages?: number; output?: OutputSpec;
}
export interface ConverseOutput {
  responseId: string; results: { path?: string; b64?: string }[]; revisedPrompt?: string;
}
interface Deps {
  client: Pick<OpenAiClient, "respond">; spendLog: SpendLog;
  config: { outputDir: string; defaultOutputMode: "path"|"base64"|"both"; base64FallbackMaxBytes: number;
    aiFilenames: boolean; maxCostPerCallUsd?: number };
  now: () => string;
}

export class ResponsesService {
  constructor(private d: Deps) {}

  async converse(args: ConverseArgs): Promise<ConverseOutput> {
    const model = args.model ?? "gpt-image-2";
    const tool: any = { type: "image_generation" };
    if (args.partialImages !== undefined) tool.partial_images = args.partialImages;
    if (args.inputImageMask) tool.input_image_mask = { file_id: args.inputImageMask };
    if (args.action) tool.action = args.action;
    const body: any = { model, input: args.prompt, tools: [tool] };
    if (args.previousResponseId) body.previous_response_id = args.previousResponseId;

    // Size/quality are chosen by the model in the Responses flow, so estimate
    // conservatively (high tier, unknown size → most expensive known) for 1 image
    // and enforce the same per-call budget guard used by generate/edit.
    const est = estimateCost({ model, quality: "auto", size: "auto", n: 1 });
    assertWithinBudget(est, this.d.config.maxCostPerCallUsd);

    const r = await this.d.client.respond(body);
    const mode = args.output?.mode ?? this.d.config.defaultOutputMode;
    const results: ConverseOutput["results"] = [];
    let idx = 0;
    for (const img of r.images) {
      idx++;
      const res: ConverseOutput["results"][number] = {};
      if (mode === "path" || mode === "both") {
        const base = this.d.config.aiFilenames ? slugifyPrompt(args.prompt) : "image";
        res.path = await writeImage({ rootDir: this.d.config.outputDir, dir: args.output?.dir,
          filename: args.output?.filename ?? `${base}-${idx}.png`, bytes: Buffer.from(img.b64, "base64") });
      }
      if (mode === "base64" || mode === "both") res.b64 = img.b64;
      results.push(res);
    }
    const act = r.usage ? actualCost({ model, usage: r.usage as any }) : undefined;
    await this.d.spendLog.append({ ts: this.d.now(), model, n: r.images.length, tokens: r.usage, estimateUsd: est, actualUsd: act });
    return { responseId: r.responseId, results, revisedPrompt: r.revisedPrompt };
  }
}
