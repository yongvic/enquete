const DEFAULT_GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
];

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

export function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY?.trim() || undefined;
}

export function getGeminiModels(): string[] {
  const raw = process.env.GEMINI_MODELS?.trim();
  if (!raw) return DEFAULT_GEMINI_MODELS;
  return raw
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
}

interface GeminiErrorBody {
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

type GeminiPart = { text?: string; thought?: boolean };

function shouldTryNextModel(status: number, body: GeminiErrorBody): boolean {
  if (status === 404 || status === 429 || status === 503) return true;
  const statusText = body.error?.status?.toUpperCase() || "";
  const message = (body.error?.message || "").toLowerCase();
  return (
    statusText === "NOT_FOUND" ||
    statusText === "RESOURCE_EXHAUSTED" ||
    statusText === "UNAVAILABLE" ||
    statusText === "INVALID_ARGUMENT" ||
    message.includes("not found") ||
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("resource exhausted") ||
    message.includes("no longer available") ||
    message.includes("is not supported") ||
    message.includes("thinking_budget") ||
    message.includes("thinkingconfig")
  );
}

export interface GeminiGenerateResult {
  text: string;
  modelUsed: string;
  finishReason?: string;
  truncated?: boolean;
}

function extractText(body: {
  candidates?: { content?: { parts?: GeminiPart[] }; finishReason?: string }[];
}): string | null {
  const parts = body.candidates?.[0]?.content?.parts;
  if (!parts?.length) return null;
  // Skip internal "thought" parts from Gemini 2.5+ thinking models
  const visible = parts.filter((p) => !p.thought);
  const source = visible.some((p) => p.text) ? visible : parts;
  const text = source
    .map((p) => p.text)
    .filter(Boolean)
    .join("\n")
    .trim();
  return text || null;
}

function isTruncated(finishReason?: string): boolean {
  const reason = (finishReason || "").toUpperCase();
  return reason === "MAX_TOKENS" || reason === "LENGTH";
}

export async function generateWithGeminiFallback(
  prompt: string,
  systemInstruction: string,
  options?: {
    maxOutputTokens?: number;
    temperature?: number;
    /** Disable model "thinking" so output tokens are not eaten by reasoning (Gemini 2.5+). */
    thinkingBudget?: number;
  }
): Promise<GeminiGenerateResult> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_MISSING");
  }

  const models = getGeminiModels();
  const errors: string[] = [];
  const maxOutputTokens = options?.maxOutputTokens ?? 8192;
  const temperature = options?.temperature ?? 0.35;
  const thinkingBudget = options?.thinkingBudget ?? 0;

  for (const model of models) {
    const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const attempt = async (withThinkingConfig: boolean) => {
      const generationConfig: Record<string, unknown> = {
        temperature,
        maxOutputTokens,
      };
      if (withThinkingConfig) {
        generationConfig.thinkingConfig = { thinkingBudget };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig,
        }),
      });

      const body = (await res.json()) as GeminiErrorBody & {
        candidates?: { content?: { parts?: GeminiPart[] }; finishReason?: string }[];
      };

      return { res, body };
    };

    try {
      let { res, body } = await attempt(true);

      // Older models / Pro variants may reject thinkingConfig — retry without it.
      if (
        !res.ok &&
        (body.error?.status === "INVALID_ARGUMENT" ||
          (body.error?.message || "").toLowerCase().includes("thinking"))
      ) {
        ({ res, body } = await attempt(false));
      }

      if (!res.ok) {
        const msg = body.error?.message || res.statusText || `HTTP ${res.status}`;
        errors.push(`${model}: ${msg}`);
        if (shouldTryNextModel(res.status, body)) continue;
        if (res.status === 400 || res.status === 401 || res.status === 403) {
          throw new Error(msg);
        }
        continue;
      }

      const finishReason = body.candidates?.[0]?.finishReason;
      const text = extractText(body);
      if (!text) {
        const reason = finishReason || "empty response";
        errors.push(`${model}: ${reason}`);
        continue;
      }

      return {
        text,
        modelUsed: model,
        finishReason,
        truncated: isTruncated(finishReason),
      };
    } catch (err) {
      if (err instanceof Error && err.message === "GEMINI_API_KEY_MISSING") throw err;
      errors.push(`${model}: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  throw new Error(`ALL_GEMINI_MODELS_FAILED: ${errors.join(" | ") || "no models tried"}`);
}
