import OpenAI from "openai";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "./config.js";
import { RateLimiter } from "./infra/rate-limiter.js";
import { OpenAiClient } from "./infra/openai-client.js";
import { SpendLog } from "./infra/spend-log.js";
import { ImageService } from "./services/image-service.js";
import { ResponsesService } from "./services/responses-service.js";
import * as genTool from "./tools/generate-image.js";
import * as editTool from "./tools/edit-image.js";
import * as convTool from "./tools/edit-image-conversation.js";
import * as capsTool from "./tools/image-capabilities.js";

export interface ToolContext {
  imageService: ImageService; responsesService: ResponsesService; config: Config;
}

export function buildServer(config: Config) {
  const limiter = new RateLimiter({});
  const sdk = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseUrl, timeout: config.requestTimeoutMs });
  const client = new OpenAiClient({ sdk: sdk as any, limiter, maxRetries: config.maxRetries });
  const spendLog = new SpendLog(config.spendLogPath);
  const now = () => new Date().toISOString();

  const imageService = new ImageService({ client, spendLog, config, now });
  const responsesService = new ResponsesService({ client, spendLog, config, now });
  const ctx: ToolContext = { imageService, responsesService, config };

  const server = new McpServer({ name: "openai-image-mcp", version: "0.1.0" });
  const tools = [genTool, editTool, convTool, capsTool];
  for (const t of tools) {
    server.tool(t.name, t.description, (t.schema as any).shape ?? {},
      async (args: any) => (t.handler as any)(args, ctx));
  }
  return { server, ctx, toolNames: tools.map((t) => t.name) };
}
