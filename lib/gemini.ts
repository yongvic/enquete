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
    message.includes("is not supported")
  );
}

export interface GeminiGenerateResult {
  text: string;
  modelUsed: string;
}

function extractText(body: {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
}): string | null {
  const parts = body.candidates?.[0]?.content?.parts;
  if (!parts?.length) return null;
  const text = parts
    .map((p) => p.text)
    .filter(Boolean)
    .join("\n")
    .trim();
  return text || null;
}

export async function generateWithGeminiFallback(
  prompt: string,
  systemInstruction: string,
  options?: { maxOutputTokens?: number; temperature?: number }
): Promise<GeminiGenerateResult> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_MISSING");
  }

  const models = getGeminiModels();
  const errors: string[] = [];
  const maxOutputTokens = options?.maxOutputTokens ?? 8192;
  const temperature = options?.temperature ?? 0.35;

  for (const model of models) {
    const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            maxOutputTokens,
          },
        }),
      });

      const body = (await res.json()) as GeminiErrorBody & {
        candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
      };

      if (!res.ok) {
        const msg = body.error?.message || res.statusText || `HTTP ${res.status}`;
        errors.push(`${model}: ${msg}`);
        if (shouldTryNextModel(res.status, body)) continue;
        // Auth / permission errors: stop immediately
        if (res.status === 400 || res.status === 401 || res.status === 403) {
          throw new Error(msg);
        }
        continue;
      }

      const text = extractText(body);
      if (!text) {
        const reason = body.candidates?.[0]?.finishReason || "empty response";
        errors.push(`${model}: ${reason}`);
        continue;
      }

      return { text, modelUsed: model };
    } catch (err) {
      if (err instanceof Error && err.message === "GEMINI_API_KEY_MISSING") throw err;
      errors.push(`${model}: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  throw new Error(`ALL_GEMINI_MODELS_FAILED: ${errors.join(" | ") || "no models tried"}`);
}
