import type { RateLimiter } from "./rate-limiter.js";
import { mapOpenAiError } from "./error-mapper.js";

export interface SdkLike {
  images: { generate: (b: any) => Promise<any>; edit: (b: any) => Promise<any> };
  responses: { create: (b: any) => Promise<any> };
  files: { create: (b: any) => Promise<any> };
}

export interface ImageResult { images: { b64: string }[]; usage?: object; revisedPrompt?: string }
export interface ResponsesResult { responseId: string; images: { b64: string }[]; usage?: object; revisedPrompt?: string }

function normImages(data: any): { b64: string }[] {
  return (data?.data ?? []).map((d: any) => ({ b64: d.b64_json })).filter((x: any) => x.b64);
}
const isRetryable = (e: any) => e?.status === 429 || (e?.status >= 500 && e?.status < 600);

export class OpenAiClient {
  constructor(private deps: { sdk: SdkLike; limiter: RateLimiter; maxRetries: number }) {}

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let attempt = 0;
    for (;;) {
      try {
        return await this.deps.limiter.run({}, fn);
      } catch (e: any) {
        const mapped = mapOpenAiError(e);
        if (isRetryable(e) && attempt < this.deps.maxRetries) {
          if (mapped.retryAfter !== undefined) this.deps.limiter.noteRetryAfter(mapped.retryAfter);
          attempt++;
          continue;
        }
        throw new Error(mapped.message);
      }
    }
  }

  async generate(body: any): Promise<ImageResult> {
    const r = await this.withRetry(() => this.deps.sdk.images.generate(body));
    return { images: normImages(r), usage: r?.usage, revisedPrompt: r?.data?.[0]?.revised_prompt };
  }
  async edit(body: any): Promise<ImageResult> {
    const r = await this.withRetry(() => this.deps.sdk.images.edit(body));
    return { images: normImages(r), usage: r?.usage, revisedPrompt: r?.data?.[0]?.revised_prompt };
  }
  async respond(body: any): Promise<ResponsesResult> {
    const r = await this.withRetry(() => this.deps.sdk.responses.create(body));
    const imgs = (r?.output ?? [])
      .filter((o: any) => o.type === "image_generation_call" && o.result)
      .map((o: any) => ({ b64: o.result }));
    return { responseId: r?.id, images: imgs, usage: r?.usage,
             revisedPrompt: r?.output?.find?.((o: any) => o.revised_prompt)?.revised_prompt };
  }
  async uploadFile(bytes: Buffer): Promise<string> {
    const r = await this.withRetry(() => this.deps.sdk.files.create({ file: bytes, purpose: "vision" }));
    return r.id;
  }
}
