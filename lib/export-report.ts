import { SurveyStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Question, SurveyResponse } from "@/lib/constants";
import { computeQuestionStats, formatAnswer } from "@/lib/stats";

export async function getAuthorizedSurveyExport(code: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const survey = await prisma.survey.findFirst({
    where: { code: code.toUpperCase(), status: SurveyStatus.PUBLISHED },
    include: { responses: { orderBy: { submittedAt: "asc" } } },
  });

  if (!survey || survey.userId !== session.user.id) return null;

  const questions = survey.questions as unknown as Question[];
  const responses: SurveyResponse[] = survey.responses.map((r) => ({
    id: r.id,
    surveyId: r.surveyId,
    answers: r.answers as Record<string, string | number | string[] | undefined>,
    submittedAt: r.submittedAt,
  }));

  return { survey, questions, responses };
}

export interface CrosstabRow {
  option: string;
  count: number;
  percent: number;
}

export function buildCrosstab(q: Question, responses: SurveyResponse[]): CrosstabRow[] {
  const stats = computeQuestionStats(q, responses);
  if (stats.type === "text" || stats.type === "section") return [];
  const total = responses.length || 1;
  return stats.data.map((d) => ({
    option: d.name,
    count: d.value,
    percent: Math.round((d.value / total) * 1000) / 10,
  }));
}

export interface PairwiseCrosstab {
  questionA: string;
  questionB: string;
  rows: string[];
  cols: string[];
  matrix: number[][];
  rowTotals: number[];
  colTotals: number[];
}

export function buildPairwiseCrosstab(
  qA: Question,
  qB: Question,
  responses: SurveyResponse[]
): PairwiseCrosstab | null {
  if (qA.type !== "single" || qB.type !== "single") return null;
  const rows = qA.options || [];
  const cols = qB.options || [];
  if (!rows.length || !cols.length) return null;

  const matrix = rows.map(() => cols.map(() => 0));
  const rowTotals = rows.map(() => 0);
  const colTotals = cols.map(() => 0);

  for (const r of responses) {
    const a = r.answers?.[qA.id];
    const b = r.answers?.[qB.id];
    if (typeof a !== "string" || typeof b !== "string") continue;
    const ri = rows.indexOf(a);
    const ci = cols.indexOf(b);
    if (ri >= 0 && ci >= 0) {
      matrix[ri][ci]++;
      rowTotals[ri]++;
      colTotals[ci]++;
    }
  }

  return { questionA: qA.text, questionB: qB.text, rows, cols, matrix, rowTotals, colTotals };
}

export function getPairwiseCrosstabs(questions: Question[], responses: SurveyResponse[]) {
  const singles = questions.filter((q) => q.type === "single");
  const pairs: PairwiseCrosstab[] = [];
  for (let i = 0; i < singles.length; i++) {
    for (let j = i + 1; j < singles.length; j++) {
      const tab = buildPairwiseCrosstab(singles[i], singles[j], responses);
      if (tab) pairs.push(tab);
    }
  }
  return pairs.slice(0, 10);
}

export function buildSummarySheetRows(questions: Question[], responses: SurveyResponse[]) {
  const rows: (string | number)[][] = [
    ["Question", "Type", "Réponses", "Moyenne / Info", "Min", "Max"],
  ];

  questions.forEach((q, i) => {
    const stats = computeQuestionStats(q, responses);
    if (stats.type === "section") return;
    if (stats.type === "text") {
      rows.push([`Q${i + 1}: ${q.text}`, "Texte", stats.texts.length, "—", "—", "—"]);
    } else if (stats.type === "number" || stats.type === "rating") {
      rows.push([
        `Q${i + 1}: ${q.text}`,
        q.type === "rating" ? "Note 1-5" : "Nombre",
        stats.count,
        stats.avg !== null ? stats.avg.toFixed(2) : "—",
        stats.type === "number" && stats.min !== null ? stats.min : "—",
        stats.type === "number" && stats.max !== null ? stats.max : "—",
      ]);
    } else {
      const answered = stats.data.reduce((s, d) => s + d.value, 0);
      rows.push([`Q${i + 1}: ${q.text}`, q.type === "multi" ? "Choix multiple" : "Choix unique", answered, "—", "—", "—"]);
    }
  });

  return rows;
}

export function rawResponseRows(questions: Question[], responses: SurveyResponse[]) {
  const cols = questions.filter((q) => q.type !== "section");
  const headers = ["Date", ...cols.map((q, i) => `Q${i + 1}: ${q.text}`)];
  const rows = responses.map((r) => [
    new Date(r.submittedAt).toLocaleString("fr-FR"),
    ...cols.map((q) => formatAnswer(r.answers[q.id])),
  ]);
  return { headers, rows };
}
