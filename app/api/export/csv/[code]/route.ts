import { getAuthorizedSurveyExport, buildCrosstab, buildSummarySheetRows, rawResponseRows } from "@/lib/export-report";
import { escapeCsvCell } from "@/lib/stats";
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

  const { survey, questions, responses } = data;
  const sections: string[] = [];

  // Section 1 — réponses brutes
  const raw = rawResponseRows(questions, responses);
  sections.push("# REPONSES BRUTES");
  sections.push(raw.headers.map((h) => escapeCsvCell(h)).join(","));
  raw.rows.forEach((row) => sections.push(row.map((c) => escapeCsvCell(String(c))).join(",")));

  sections.push("");
  sections.push("# SYNTHESE");
  buildSummarySheetRows(questions, responses).forEach((row) =>
    sections.push(row.map((c) => escapeCsvCell(String(c))).join(","))
  );

  sections.push("");
  sections.push("# FREQUENCES (Option;Effectif;Pourcentage)");
  questions.forEach((q, i) => {
    const tab = buildCrosstab(q, responses);
    tab.forEach((r) => {
      sections.push(
        [
          escapeCsvCell(`Q${i + 1}: ${q.text}`),
          escapeCsvCell(r.option),
          String(r.count),
          `${r.percent}%`,
        ].join(",")
      );
    });
  });

  sections.push("");
  sections.push("# NOTE: Pour tableaux croisés dynamiques et graphiques, utilisez Export Excel ou PDF.");

  const csv = "\uFEFF" + sections.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="donnees-${survey.code}.csv"`,
    },
  });
}
