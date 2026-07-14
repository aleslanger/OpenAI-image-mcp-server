# OpenAI image mcp

MCP server for OpenAI **gpt-image** models — generate, edit, and multi-turn edit
images straight from Claude (or any MCP client).

## Tools

- `generate_image` — text → image(s)
- `edit_image` — edit / extend / compose with an optional mask
- `edit_image_conversation` — multi-turn iterative edit (Responses API)
- `image_capabilities` — discover models, params, pricing as-of date

---

## Quick start

### 1. Get the code & build

```bash
git clone <repo-url> openai-image-mcp
cd openai-image-mcp
npm install
npm run build
```

`npm run build` produces `dist/index.js` — the entrypoint you point Claude at.

### 2. Register with Claude Code (one command)

```bash
claude mcp add openai-image --scope user \
  --env OPENAI_API_KEY=sk-your-openai-api-key \
  --env IMAGE_OUTPUT_DIR=/absolute/path/to/images \
  -- node /absolute/path/to/openai-image-mcp/dist/index.js
```

- Use an **absolute** path to `dist/index.js` (output of step 1).
- `IMAGE_OUTPUT_DIR` is where generated images are written. Optional — defaults to
  `~/Pictures/openai-image-mcp`.
- `--scope user` makes it available in every project. Use `--scope project` to limit
  it to the current repo.

Verify it registered:

```bash
claude mcp list
```

### 3. Use it

In Claude, just ask — e.g. *"generate an image of a red bicycle on the beach"*.
The server writes the file under `IMAGE_OUTPUT_DIR` and returns the path.

---

## Configuration (env vars)

| Var | Required | Default | Purpose |
|-----|----------|---------|---------|
| `OPENAI_API_KEY` | **yes**¹ | — | OpenAI API key |
| `OPENAI_API_KEY_FILE` | **yes**¹ | — | path to a file containing the API key (trailing whitespace trimmed); used when `OPENAI_API_KEY` is unset |
| `IMAGE_OUTPUT_DIR` | no | `~/Pictures/openai-image-mcp` | where images are saved |
| `DEFAULT_MODEL` | no | `gpt-image-2` | gpt-image-1 / gpt-image-1-mini / gpt-image-2 |
| `DEFAULT_OUTPUT_MODE` | no | `path` | `path` \| `base64` \| `both` |
| `MAX_COST_PER_CALL_USD` | no | — | reject a call whose estimate exceeds this |
| `CONFIRM_ABOVE_N` | no | — | require `confirm:true` when generating more than N images |
| `ALLOW_URL_INPUT` | no | `false` | allow image inputs given as URLs (see Security) |

¹ Exactly one of `OPENAI_API_KEY` or `OPENAI_API_KEY_FILE` is required. Prefer `OPENAI_API_KEY_FILE` pointing to a `chmod 600` file so the key does not live in client config files.
| `SPEND_LOG_PATH` | no | — | append per-call cost records as JSONL |
| `PROMPT_ENHANCE` | no | `false` | locally augment short prompts (no extra LLM call) |
| `OPENAI_BASE_URL` | no | — | override API base URL |
| `LOG_LEVEL` | no | `info` | `debug` \| `info` \| `warn` \| `error` |

Add any of these as extra `--env KEY=value` flags on the `claude mcp add` command.

---

## Manual MCP config (other clients)

If your client uses a JSON config (Claude Desktop, Cursor, VSCode), add:

```json
{
  "mcpServers": {
    "openai-image": {
      "command": "node",
      "args": ["/absolute/path/to/openai-image-mcp/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "sk-your-openai-api-key",
        "IMAGE_OUTPUT_DIR": "/absolute/path/to/images"
      }
    }
  }
}
```

---

## Security notes

- URL image input is **off by default**. Set `ALLOW_URL_INPUT=true` to enable. When on,
  fetches resolve all DNS addresses and reject any private / loopback / link-local /
  CGNAT / IPv4-mapped target, re-validating on every redirect hop (SSRF guard).
- Output paths are confined to `IMAGE_OUTPUT_DIR`; existing files are never overwritten
  (a numeric suffix is added on collision).
- Logs go to **stderr** only; stdout is reserved for the MCP protocol.

---

## Development

```bash
npm test          # run the vitest suite
npm run typecheck # tsc --noEmit
npm run build     # compile to dist/
```

## Notes

- Models: gpt-image-1 (deprecating 2026-10-23), gpt-image-1-mini, gpt-image-2 (default).
- DALL-E was removed from the OpenAI API (2026-05-12) — not supported.
- Pricing data is as of 2026-06; query the `image_capabilities` tool for details.
