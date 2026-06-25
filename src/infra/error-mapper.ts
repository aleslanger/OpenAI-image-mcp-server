interface OaiErr {
  status?: number; code?: string; message?: string;
  headers?: Record<string, string>;
  error?: { code?: string; moderation_details?: { moderation_stage?: string; categories?: string[] } };
}

export function mapOpenAiError(err: unknown): { message: string; retryAfter?: number } {
  const e = (err ?? {}) as OaiErr;
  const code = e.code ?? e.error?.code;
  const msg = e.message ?? String(err);

  if (code === "moderation_blocked") {
    const d = e.error?.moderation_details;
    const stage = d?.moderation_stage ?? "unknown";
    const cats = (d?.categories ?? []).join(", ") || "n/a";
    return { message: `Content moderation blocked (${stage} stage). Categories: ${cats}.` };
  }
  if (e.status === 403 && /verif/i.test(msg)) {
    return { message: `Organization not verified for gpt-image-* models. Verify at platform.openai.com.` };
  }
  if (e.status === 429) {
    const ra = e.headers?.["retry-after"];
    const dim = /image/i.test(msg) ? "IPM (images/min)" : "TPM (tokens/min)";
    return { message: `Rate limited (${dim}). ${msg}`, retryAfter: ra ? Number(ra) : undefined };
  }
  if (e.status === 404 && /previous response/i.test(msg)) {
    return { message: `Conversation expired (responses are kept 30 days). Start a new conversation.` };
  }
  return { message: msg };
}
