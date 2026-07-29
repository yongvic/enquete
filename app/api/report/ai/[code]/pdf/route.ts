import { getAuthorizedSurveyExport } from "@/lib/export-report";
import { buildAiReportPdf } from "@/lib/ai-report-pdf";
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

  let report = "";
  try {
    const body = await req.json();
    report = String(body?.report || "").trim();
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  if (!report) {
    return NextResponse.json({ error: "emptyReport" }, { status: 400 });
  }

  const buffer = buildAiReportPdf(data.survey.title, data.survey.code!, report);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="rapport-ia-${data.survey.code}.pdf"`,
    },
  });
}
