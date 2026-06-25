interface Clock { now: () => number; sleep: (ms: number) => Promise<void>; }
const realClock: Clock = { now: () => Date.now(), sleep: (ms) => new Promise((r) => setTimeout(r, ms)) };

export class RateLimiter {
  private chain: Promise<unknown> = Promise.resolve();
  private resumeAt = 0;
  constructor(
    private opts: { tpm?: number; ipm?: number } = {},
    private clock: Clock = realClock,
  ) {}

  noteRetryAfter(seconds: number): void {
    this.resumeAt = Math.max(this.resumeAt, this.clock.now() + seconds * 1000);
  }

  run<T>(_cost: { tokens?: number; images?: number }, fn: () => Promise<T>): Promise<T> {
    const result = this.chain.then(async () => {
      const wait = this.resumeAt - this.clock.now();
      if (wait > 0) await this.clock.sleep(wait);
      return fn();
    });
    this.chain = result.catch(() => undefined);
    return result;
  }
}
