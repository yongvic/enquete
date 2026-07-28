import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Question } from "@/lib/constants";
import { escapeCsvCell, formatAnswer } from "@/lib/stats";
import { NextRequest, NextResponse } from "next/server";

async function getAuthorizedSurvey(code: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const survey = await prisma.survey.findUnique({
    where: { code: code.toUpperCase() },
    include: { responses: { orderBy: { submittedAt: "asc" } } },
  });

  if (!survey || survey.userId !== session.user.id) return null;
  return survey;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const survey = await getAuthorizedSurvey(code);
  if (!survey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const questions = survey.questions as unknown as Question[];
  const headers = [
    "submittedAt",
    ...questions.map((q, i) => `Q${i + 1}: ${q.text}`),
  ];

  const rows = survey.responses.map((r) => {
    const answers = r.answers as Record<string, unknown>;
    return [
      r.submittedAt.toISOString(),
      ...questions.map((q) => formatAnswer(answers[q.id])),
    ];
  });

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => escapeCsvCell(String(cell))).join(","))
    .join("\n");

  return new NextResponse("\uFEFF" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sondage-${survey.code}.csv"`,
    },
  });
}
