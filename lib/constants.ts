export const INK = "#1E2A38";
export const PAPER = "#F7F5EF";
export const OCHRE = "#C9971C";
export const SLATE = "#8B96A5";
export const GREEN = "#4F7942";
export const RUST = "#A63446";
export const PALETTE = [INK, OCHRE, GREEN, RUST, SLATE, "#6B4C9A"];

export type QuestionType = "single" | "multi" | "rating" | "number" | "text";

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
  unit?: string;
}

export interface SurveyData {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  questions: Question[];
  createdAt: Date | string;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  answers: Record<string, string | number | string[] | undefined>;
  submittedAt: Date | string;
}

export function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function makeSurveyCode(len = 5): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function getAppUrl(): string {
  const candidates = [process.env.NEXT_PUBLIC_APP_URL, process.env.AUTH_URL, "http://localhost:3000"];
  for (const raw of candidates) {
    const value = (raw || "").trim().replace(/\/$/, "");
    if (!value) continue;
    try {
      // Validates absolute URL (protocol + host)
      // eslint-disable-next-line no-new
      new URL(value);
      return value;
    } catch {
      // ignore invalid env and try next candidate
    }
  }
  return "http://localhost:3000";
}

export function getSurveyShareUrl(code: string, locale = "fr"): string {
  return `${getAppUrl()}/${locale}/repondre/${code}`;
}
