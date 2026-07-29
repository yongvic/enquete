const DEFAULT_GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-pro",
];

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

function isRetryableGeminiError(status: number, body: GeminiErrorBody): boolean {
  if (status === 429 || status === 503) return true;
  const statusText = body.error?.status?.toUpperCase() || "";
  const message = (body.error?.message || "").toLowerCase();
  return (
    statusText === "RESOURCE_EXHAUSTED" ||
    statusText === "UNAVAILABLE" ||
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("resource exhausted")
  );
}

export interface GeminiGenerateResult {
  text: string;
  modelUsed: string;
}

export async function generateWithGeminiFallback(
  prompt: string,
  systemInstruction: string
): Promise<GeminiGenerateResult> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_MISSING");
  }

  const models = getGeminiModels();
  const errors: string[] = [];

  for (const model of models) {
    const url = `https://generativeai.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 8192,
          },
        }),
      });

      const body = (await res.json()) as GeminiErrorBody & {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };

      if (!res.ok) {
        const msg = body.error?.message || res.statusText;
        errors.push(`${model}: ${msg}`);
        if (isRetryableGeminiError(res.status, body)) continue;
        throw new Error(msg);
      }

      const text = body.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!text) {
        errors.push(`${model}: empty response`);
        continue;
      }

      return { text, modelUsed: model };
    } catch (err) {
      if (err instanceof Error && err.message === "GEMINI_API_KEY_MISSING") throw err;
      errors.push(`${model}: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  throw new Error(errors.join(" | ") || "ALL_GEMINI_MODELS_FAILED");
}
