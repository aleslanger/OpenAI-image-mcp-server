import { describe, it, expect, vi } from "vitest";
import { createLogger } from "../src/logger.js";

describe("logger", () => {
  it("writes to stderr, never stdout", () => {
    const err = vi.spyOn(process.stderr, "write").mockReturnValue(true);
    const out = vi.spyOn(process.stdout, "write").mockReturnValue(true);
    const log = createLogger("info");
    log.info("hello");
    expect(err).toHaveBeenCalled();
    expect(out).not.toHaveBeenCalled();
    err.mockRestore(); out.mockRestore();
  });

  it("suppresses below configured level", () => {
    const err = vi.spyOn(process.stderr, "write").mockReturnValue(true);
    const log = createLogger("warn");
    log.info("skip me");
    expect(err).not.toHaveBeenCalled();
    err.mockRestore();
  });
});
