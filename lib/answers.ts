import { Question } from "./constants";

export function isQuestionRequired(q: Question): boolean {
  return q.required === true;
}

export function isAnswerFilled(q: Question, value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (q.type === "multi") return Array.isArray(value) && value.length > 0;
  if (q.type === "text") return String(value).trim().length > 0;
  if (q.type === "number" || q.type === "rating") return typeof value === "number" && !Number.isNaN(value);
  return value !== "";
}

export function getMissingRequiredQuestions(
  questions: Question[],
  answers: Record<string, unknown>
): Question[] {
  return questions.filter((q) => isQuestionRequired(q) && !isAnswerFilled(q, answers[q.id]));
}
