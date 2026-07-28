import { getAuthorizedSurveyExport } from "@/lib/export-report";
import { buildSurveyXlsx } from "@/lib/xlsx-report";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const data = await getAuthorizedSurveyExport(code);
  if (!data) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const buffer = await buildSurveyXlsx(data.survey, data.questions, data.responses);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rapport-${data.survey.code}.xlsx"`,
    },
  });
}
