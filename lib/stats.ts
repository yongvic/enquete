import { Question, SurveyResponse } from "./constants";

export interface ChartDatum {
  name: string;
  value: number;
}

export interface TimelineDatum {
  name: string;
  value: number;
  /** ISO date key YYYY-MM-DD for sorting */
  key: string;
}

export interface CompletionDatum {
  name: string;
  value: number;
  answered: number;
  total: number;
}

export interface RatingOverviewDatum {
  name: string;
  value: number;
  fullLabel: string;
}

function hasAnswer(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "number") return !Number.isNaN(value);
  return true;
}

function dayKey(date: Date | string): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDayLabel(key: string, locale: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

export function computeGlobalOverview(
  questions: Question[],
  responses: SurveyResponse[],
  locale = "fr"
) {
  const total = responses.length;

  const byDay = new Map<string, number>();
  for (const r of responses) {
    const key = dayKey(r.submittedAt);
    byDay.set(key, (byDay.get(key) || 0) + 1);
  }
  const timeline: TimelineDatum[] = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({
      key,
      name: formatDayLabel(key, locale),
      value,
    }));

  const completion: CompletionDatum[] = questions.map((q, i) => {
    const answered = responses.filter((r) => hasAnswer(r.answers?.[q.id])).length;
    return {
      name: `Q${i + 1}`,
      value: total ? Math.round((answered / total) * 100) : 0,
      answered,
      total,
    };
  });

  const avgCompletion =
    completion.length > 0
      ? Math.round(completion.reduce((s, c) => s + c.value, 0) / completion.length)
      : 0;

  const ratings: RatingOverviewDatum[] = [];
  questions.forEach((q, i) => {
    if (q.type !== "rating") return;
    const stats = computeQuestionStats(q, responses);
    if (stats.type !== "rating" || stats.avg === null) return;
    ratings.push({
      name: `Q${i + 1}`,
      value: Math.round(stats.avg * 10) / 10,
      fullLabel: q.text,
    });
  });

  const leadingChoices: ChartDatum[] = [];
  questions.forEach((q, i) => {
    if (q.type !== "single") return;
    const stats = computeQuestionStats(q, responses);
    if (stats.type !== "single") return;
    const top = [...stats.data].sort((a, b) => b.value - a.value)[0];
    if (!top || top.value === 0) return;
    leadingChoices.push({
      name: `Q${i + 1} · ${top.name}`,
      value: top.value,
    });
  });

  return {
    total,
    timeline,
    completion,
    avgCompletion,
    ratings,
    leadingChoices,
  };
}

export function computeQuestionStats(q: Question, responses: SurveyResponse[]) {
  if (q.type === "text") {
    const texts = responses
      .map((r) => r.answers?.[q.id])
      .filter((t) => t && String(t).trim()) as string[];
    return { type: "text" as const, texts };
  }

  if (q.type === "number") {
    const vals = responses
      .map((r) => r.answers?.[q.id])
      .filter((v) => typeof v === "number" && !Number.isNaN(v)) as number[];
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    const min = vals.length ? Math.min(...vals) : null;
    const max = vals.length ? Math.max(...vals) : null;
    const uniq = Array.from(new Set(vals)).sort((a, b) => a - b);
    const data: ChartDatum[] = uniq.map((v) => ({
      name: `${v}${q.unit ? ` ${q.unit}` : ""}`,
      value: vals.filter((x) => x === v).length,
    }));
    return { type: "number" as const, avg, min, max, data, count: vals.length };
  }

  if (q.type === "rating") {
    const vals = responses
      .map((r) => r.answers?.[q.id])
      .filter((v) => typeof v === "number") as number[];
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    const data: ChartDatum[] = [1, 2, 3, 4, 5].map((n) => ({
      name: String(n),
      value: vals.filter((v) => v === n).length,
    }));
    return { type: "rating" as const, avg, data, count: vals.length };
  }

  const options = q.options || [];
  const data: ChartDatum[] = options.map((opt) => {
    const count = responses.filter((r) => {
      const a = r.answers?.[q.id];
      if (q.type === "multi") return Array.isArray(a) && a.includes(opt);
      return a === opt;
    }).length;
    return { name: opt, value: count };
  });

  return { type: q.type as "single" | "multi", data, total: responses.length };
}

export function formatAnswer(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) return value.join("; ");
  return String(value);
}

export function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
