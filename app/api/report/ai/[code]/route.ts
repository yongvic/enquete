import { getAuthorizedSurveyExport } from "@/lib/export-report";
import { generateAiReport } from "@/lib/ai-report";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const data = await getAuthorizedSurveyExport(code);
  if (!data) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }

  let locale = "fr";
  try {
    const body = await req.json();
    if (body?.locale === "en" || body?.locale === "fr") locale = body.locale;
  } catch {
    // default locale
  }

  try {
    const result = await generateAiReport(
      data.survey,
      data.questions,
      data.responses,
      locale
    );
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[ai-report]", message);
    if (message === "GEMINI_API_KEY_MISSING") {
      return NextResponse.json({ error: "apiKeyMissing" }, { status: 503 });
    }
    if (message === "NO_RESPONSES") {
      return NextResponse.json({ error: "noResponses" }, { status: 400 });
    }

    const lower = message.toLowerCase();
    const isQuota =
      lower.includes("quota") ||
      lower.includes("resource_exhausted") ||
      lower.includes("rate limit") ||
      (lower.includes("all_gemini_models_failed") &&
        (lower.includes("quota") || lower.includes("resource_exhausted") || lower.includes("429")));

    if (isQuota) {
      return NextResponse.json({ error: "quotaExceeded" }, { status: 429 });
    }

    if (message.includes("ALL_GEMINI_MODELS_FAILED")) {
      return NextResponse.json(
        { error: "generationFailed", detail: message.slice(0, 500) },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: "generationFailed", detail: message.slice(0, 500) }, { status: 500 });
  }
}
