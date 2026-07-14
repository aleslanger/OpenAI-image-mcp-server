import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { LogLevel } from "./logger.js";

export interface Config {
  apiKey: string;
  baseUrl?: string;
  outputDir: string;
  defaultModel: string;
  defaultOutputMode: "path" | "base64" | "both";
  base64FallbackMaxBytes: number;
  aiFilenames: boolean;
  promptEnhance: boolean;
  maxRetries: number;
  requestTimeoutMs: number;
  maxImagesPerCall: number;
  maxCostPerCallUsd?: number;
  confirmAboveN?: number;
  spendLogPath?: string;
  allowUrlInput: boolean;
  logLevel: LogLevel;
}

const bool = (v: string | undefined, d: boolean) =>
  v === undefined ? d : v === "true" || v === "1";
const num = (v: string | undefined, d: number) =>
  v === undefined ? d : Number(v);
const optNum = (v: string | undefined) =>
  v === undefined ? undefined : Number(v);

function resolveApiKey(env: NodeJS.ProcessEnv): string {
  const direct = env.OPENAI_API_KEY?.trim();
  if (direct) return direct;
  if (env.OPENAI_API_KEY_FILE) {
    let raw: string;
    try {
      raw = fs.readFileSync(env.OPENAI_API_KEY_FILE, "utf8");
    } catch (e) {
      throw new Error(
        `OPENAI_API_KEY_FILE is not readable: ${env.OPENAI_API_KEY_FILE} (${e instanceof Error ? e.message : String(e)})`,
      );
    }
    const key = raw.trim();
    if (!key) {
      throw new Error(`OPENAI_API_KEY_FILE is empty: ${env.OPENAI_API_KEY_FILE}`);
    }
    return key;
  }
  throw new Error("OPENAI_API_KEY is required");
}

export function loadConfig(env: NodeJS.ProcessEnv): Config {
  return {
    apiKey: resolveApiKey(env),
    baseUrl: env.OPENAI_BASE_URL,
    outputDir: env.IMAGE_OUTPUT_DIR ?? path.join(os.homedir(), "Pictures", "openai-image-mcp"),
    defaultModel: env.DEFAULT_MODEL ?? "gpt-image-2",
    defaultOutputMode: (env.DEFAULT_OUTPUT_MODE as Config["defaultOutputMode"]) ?? "path",
    base64FallbackMaxBytes: num(env.BASE64_FALLBACK_MAX_BYTES, 1048576),
    aiFilenames: bool(env.AI_FILENAMES, true),
    promptEnhance: bool(env.PROMPT_ENHANCE, false),
    maxRetries: num(env.MAX_RETRIES, 4),
    requestTimeoutMs: num(env.REQUEST_TIMEOUT_MS, 150000),
    maxImagesPerCall: num(env.MAX_IMAGES_PER_CALL, 10),
    maxCostPerCallUsd: optNum(env.MAX_COST_PER_CALL_USD),
    confirmAboveN: optNum(env.CONFIRM_ABOVE_N),
    spendLogPath: env.SPEND_LOG_PATH,
    allowUrlInput: bool(env.ALLOW_URL_INPUT, false),
    logLevel: (env.LOG_LEVEL as LogLevel) ?? "info",
  };
}
