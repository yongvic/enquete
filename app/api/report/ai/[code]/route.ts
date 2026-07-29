import { getAuthorizedSurveyExport } from "@/lib/export-report";
import { generateAiReport, listAiReportsForSurvey, saveAiReport } from "@/lib/ai-report";
import { assertCanGenerateAiReport, getAiReportQuota } from "@/lib/ai-report-quota";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }

  const data = await getAuthorizedSurveyExport(code);
  if (!data) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }

  const [reports, quota] = await Promise.all([
    listAiReportsForSurvey(data.survey.id, session.user.id),
    getAiReportQuota(session.user.id, session.user.role),
  ]);

  return NextResponse.json({
    reports: reports.map((r) => ({
      id: r.id,
      content: r.content,
      locale: r.locale,
      createdAt: r.createdAt.toISOString(),
    })),
    quota,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }

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
    await assertCanGenerateAiReport(session.user.id, session.user.role);

    const result = await generateAiReport(
      data.survey,
      data.questions,
      data.responses,
      locale
    );

    const saved = await saveAiReport({
      surveyId: data.survey.id,
      userId: session.user.id,
      content: result.report,
      locale,
    });

    const quota = await getAiReportQuota(session.user.id, session.user.role);
    const reports = await listAiReportsForSurvey(data.survey.id, session.user.id);

    return NextResponse.json({
      report: saved.content,
      reportId: saved.id,
      createdAt: saved.createdAt.toISOString(),
      responseCount: result.responseCount,
      reports: reports.map((r) => ({
        id: r.id,
        content: r.content,
        locale: r.locale,
        createdAt: r.createdAt.toISOString(),
      })),
      quota,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[ai-report]", message);
    if (message === "GEMINI_API_KEY_MISSING") {
      return NextResponse.json({ error: "apiKeyMissing" }, { status: 503 });
    }
    if (message === "NO_RESPONSES") {
      return NextResponse.json({ error: "noResponses" }, { status: 400 });
    }
    if (message === "DAILY_LIMIT") {
      return NextResponse.json({ error: "dailyLimit" }, { status: 429 });
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
