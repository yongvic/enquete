import { Question, SurveyResponse } from "./constants";

export interface ChartDatum {
  name: string;
  value: number;
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
