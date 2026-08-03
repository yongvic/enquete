import { Question, SurveyResponse } from "@/lib/constants";
import {
  buildCrosstab,
  getPairwiseCrosstabs,
} from "@/lib/export-report";
import { computeQuestionStats } from "@/lib/stats";
import { generateWithGeminiFallback } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

export interface AiReportDataset {
  title: string;
  description: string | null;
  code: string;
  responseCount: number;
  generatedAt: string;
  questions: Array<{
    index: number;
    text: string;
    type: string;
    required: boolean;
    stats: Record<string, unknown>;
  }>;
  crosstabs: Array<{
    questionA: string;
    questionB: string;
    matrix: number[][];
    rows: string[];
    cols: string[];
  }>;
}

export function buildAiReportDataset(
  survey: { title: string; description: string | null; code: string | null },
  questions: Question[],
  responses: SurveyResponse[]
): AiReportDataset {
  const responseCount = responses.length;

  const questionStats = questions
    .map((q, i) => {
      const stats = computeQuestionStats(q, responses);
      if (stats.type === "section") return null;
      const base = {
        index: i + 1,
        text: q.text,
        type: q.type,
        required: !!q.required,
      };

      if (stats.type === "text") {
        return {
          ...base,
          stats: {
            kind: "text",
            answerCount: stats.texts.length,
            note: "Réponses texte libre non transmises (confidentialité).",
          },
        };
      }

      if (stats.type === "number" || stats.type === "rating") {
        const frequencies = stats.data.map((d) => ({
          label: d.name,
          count: d.value,
          percent: responseCount ? Math.round((d.value / responseCount) * 1000) / 10 : 0,
        }));
        return {
          ...base,
          stats: {
            kind: stats.type,
            answeredCount: stats.count,
            average: stats.avg !== null ? Math.round(stats.avg * 100) / 100 : null,
            min: stats.type === "number" ? stats.min : null,
            max: stats.type === "number" ? stats.max : null,
            frequencies,
          },
        };
      }

      const frequencies = buildCrosstab(q, responses).map((row) => ({
        option: row.option,
        count: row.count,
        percent: row.percent,
      }));

      return {
        ...base,
        stats: {
          kind: stats.type,
          frequencies,
        },
      };
    })
    .filter(Boolean) as AiReportDataset["questions"];

  const crosstabs = getPairwiseCrosstabs(questions, responses)
    .slice(0, 4)
    .map((p) => ({
      questionA: p.questionA,
      questionB: p.questionB,
      rows: p.rows,
      cols: p.cols,
      matrix: p.matrix,
    }));

  return {
    title: survey.title,
    description: survey.description,
    code: survey.code || "",
    responseCount,
    generatedAt: new Date().toISOString(),
    questions: questionStats,
    crosstabs,
  };
}

function systemInstruction(locale: string): string {
  if (locale === "en") {
    return `You are a concise research assistant for academic surveys.
Write SHORT reports in English based ONLY on the aggregated statistics provided.
Never invent numbers. Do not ramble. Prefer bullets over long paragraphs.
Hard limit: about 250–350 words total.
Use exactly this Markdown structure:
## Synthesis
## Key findings
## Limits
Tone: clear, academic, direct.`;
  }

  return `Tu es un assistant de recherche concis pour sondages académiques.
Rédige des rapports COURTS en français à partir UNIQUEMENT des statistiques agrégées fournies.
N'invente jamais de chiffres. Ne sois pas verbeux. Préfère les puces aux longs paragraphes.
Limite dure : environ 250–350 mots au total.
Utilise exactement cette structure Markdown :
## Synthèse
## Points clés
## Limites
Ton : clair, académique, direct.`;
}

function buildPrompt(dataset: AiReportDataset, locale: string): string {
  const payload = JSON.stringify(dataset, null, 2);
  if (locale === "en") {
    return `Produce a short global synthesis of these survey results.

JSON data:
${payload}

Rules:
- Start with sample size (${dataset.responseCount} responses) in ## Synthesis (4–6 sentences max).
- ## Key findings: 4–6 bullets with exact counts/percentages. Only the strongest patterns.
- ## Limits: 2–3 short bullets (sample size, self-report bias, AI-generated caveat).
- No other sections. No fluff. No repeating the same idea.`;
  }

  return `Produis une synthèse globale courte de ces résultats de sondage.

Données JSON :
${payload}

Règles :
- Commence par la taille d'échantillon (${dataset.responseCount} réponses) dans ## Synthèse (4–6 phrases max).
- ## Points clés : 4–6 puces avec effectifs/pourcentages exacts. Uniquement les tendances les plus marquantes.
- ## Limites : 2–3 puces courtes (échantillon, biais d'auto-déclaration, rapport généré par IA).
- Aucune autre section. Pas de remplissage. Pas de répétition.`;
}

export async function generateAiReport(
  survey: { title: string; description: string | null; code: string | null },
  questions: Question[],
  responses: SurveyResponse[],
  locale: string
) {
  if (responses.length === 0) {
    throw new Error("NO_RESPONSES");
  }

  const dataset = buildAiReportDataset(survey, questions, responses);
  const prompt = buildPrompt(dataset, locale);
  const result = await generateWithGeminiFallback(prompt, systemInstruction(locale), {
    // Gemini 2.5 "thinking" shares this budget — keep it high and disable thinking below.
    maxOutputTokens: 8192,
    temperature: 0.25,
    thinkingBudget: 0,
  });

  let report = normalizeAiReportMarkdown(result.text);
  if (result.truncated) {
    // Prefer a complete report: one retry with an even clearer "finish all sections" nudge.
    try {
      const retry = await generateWithGeminiFallback(
        `${prompt}\n\nIMPORTANT: Finish ALL three sections completely. Do not stop mid-sentence.`,
        systemInstruction(locale),
        { maxOutputTokens: 8192, temperature: 0.2, thinkingBudget: 0 }
      );
      if (retry.text && !retry.truncated) {
        report = normalizeAiReportMarkdown(retry.text);
      } else if (retry.text && retry.text.length > report.length) {
        report = normalizeAiReportMarkdown(retry.text);
      }
    } catch {
      // keep first result
    }
  }

  return {
    report,
    responseCount: dataset.responseCount,
  };
}

/** Strip fences / normalize heading markers so the client renderer never drops a section. */
export function normalizeAiReportMarkdown(raw: string): string {
  let text = raw.replace(/\r\n/g, "\n").trim();
  const fence = text.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/i);
  if (fence) text = fence[1].trim();
  // Ensure ATX headings are on their own line with a space after #
  text = text.replace(/([^\n])(#{1,3}\s)/g, "$1\n$2");
  return text.trim();
}

export async function saveAiReport(input: {
  surveyId: string;
  userId: string;
  content: string;
  locale: string;
}) {
  return prisma.aiReport.create({
    data: {
      surveyId: input.surveyId,
      userId: input.userId,
      content: input.content,
      locale: input.locale,
    },
    select: {
      id: true,
      content: true,
      locale: true,
      createdAt: true,
    },
  });
}

export async function listAiReportsForSurvey(surveyId: string, userId: string) {
  return prisma.aiReport.findMany({
    where: { surveyId, userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      content: true,
      locale: true,
      createdAt: true,
    },
  });
}
