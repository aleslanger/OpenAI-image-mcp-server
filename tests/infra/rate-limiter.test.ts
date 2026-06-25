import { describe, it, expect } from "vitest";
import { RateLimiter } from "../../src/infra/rate-limiter.js";

describe("rate-limiter", () => {
  it("runs tasks and returns results", async () => {
    const rl = new RateLimiter({ ipm: 100 });
    const r = await rl.run({ images: 1 }, async () => 42);
    expect(r).toBe(42);
  });

  it("serializes — no two fns run concurrently", async () => {
    const rl = new RateLimiter({ ipm: 1000 });
    let active = 0, maxActive = 0;
    const task = () => rl.run({ images: 1 }, async () => {
      active++; maxActive = Math.max(maxActive, active);
      await new Promise((r) => setTimeout(r, 5));
      active--; return null;
    });
    await Promise.all([task(), task(), task()]);
    expect(maxActive).toBe(1);
  });

  it("waits when retry-after set (uses injected sleep)", async () => {
    let slept = 0;
    const rl = new RateLimiter({ ipm: 1000 }, { now: () => 0, sleep: async (ms) => { slept += ms; } });
    rl.noteRetryAfter(2);
    await rl.run({ images: 1 }, async () => null);
    expect(slept).toBeGreaterThanOrEqual(2000);
  });
});
