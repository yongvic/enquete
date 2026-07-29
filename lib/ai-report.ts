import { Question, SurveyResponse } from "@/lib/constants";
import {
  buildCrosstab,
  getPairwiseCrosstabs,
} from "@/lib/export-report";
import { computeQuestionStats } from "@/lib/stats";
import { generateWithGeminiFallback } from "@/lib/gemini";

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

  const questionStats = questions.map((q, i) => {
    const stats = computeQuestionStats(q, responses);
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
  });

  const crosstabs = getPairwiseCrosstabs(questions, responses).map((p) => ({
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
    return `You are a research assistant specializing in survey data analysis for academic work (theses, dissertations, medical enquiries).
Write clear, professional reports in English based ONLY on the aggregated statistics provided.
Never invent numbers. If data is insufficient, say so explicitly.
Use Markdown with these sections: ## Executive summary, ## Key findings, ## Cross-tabulation insights, ## Methodological limitations, ## Recommendations for further analysis.
Tone: academic but accessible.`;
  }

  return `Tu es un assistant de recherche spécialisé dans l'analyse de sondages pour travaux universitaires (mémoires, thèses, enquêtes médicales).
Rédige des rapports clairs et professionnels en français à partir UNIQUEMENT des statistiques agrégées fournies.
N'invente jamais de chiffres. Si les données sont insuffisantes, indique-le explicitement.
Utilise le Markdown avec ces sections : ## Synthèse exécutive, ## Principaux résultats, ## Analyse des tableaux croisés, ## Limites méthodologiques, ## Pistes d'analyse complémentaire.
Ton : académique mais accessible.`;
}

function buildPrompt(dataset: AiReportDataset, locale: string): string {
  const payload = JSON.stringify(dataset, null, 2);
  if (locale === "en") {
    return `Analyze the following survey results and produce a structured analytical report.

Survey metadata and aggregated statistics (JSON):
${payload}

Rules:
- Cite percentages and counts exactly as given.
- For text questions, only the response count is available — do not speculate on content.
- Mention sample size (${dataset.responseCount} responses) in the executive summary.
- Highlight the most salient patterns and any notable cross-tabulations.
- End with a short disclaimer that this report is AI-generated and must be verified.`;
  }

  return `Analyse les résultats de sondage suivants et produis un rapport analytique structuré.

Métadonnées et statistiques agrégées (JSON) :
${payload}

Règles :
- Cite exactement les pourcentages et effectifs fournis.
- Pour les questions texte, seul le nombre de réponses est disponible — ne pas spéculer sur le contenu.
- Mentionne la taille de l'échantillon (${dataset.responseCount} réponses) dans la synthèse.
- Mets en avant les tendances principales et les croisements notables.
- Termine par un bref avertissement indiquant que ce rapport est généré par IA et doit être vérifié.`;
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
  const result = await generateWithGeminiFallback(prompt, systemInstruction(locale));

  return {
    report: result.text,
    modelUsed: result.modelUsed,
    responseCount: dataset.responseCount,
  };
}
