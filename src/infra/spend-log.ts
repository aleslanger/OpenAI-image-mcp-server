import { appendFile } from "node:fs/promises";

export interface SpendEntry {
  ts: string; model: string; n: number;
  tokens?: object; estimateUsd: number; actualUsd?: number;
}

export class SpendLog {
  private chain: Promise<unknown> = Promise.resolve();
  constructor(private path?: string) {}
  append(entry: SpendEntry): Promise<void> {
    if (!this.path) return Promise.resolve();
    const p = this.path;
    const result = this.chain.then(() => appendFile(p, JSON.stringify(entry) + "\n"));
    this.chain = result.catch(() => undefined);
    return result;
  }
}
