#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { createLogger } from "./logger.js";
import { buildServer } from "./server.js";

async function main() {
  const config = loadConfig(process.env);
  const log = createLogger(config.logLevel);
  const { server } = buildServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log.info("openai-image-mcp started");
}

main().catch((e) => { process.stderr.write(`fatal: ${e?.message ?? e}\n`); process.exit(1); });
