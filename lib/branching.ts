import { Question } from "./constants";

export type BranchTarget = "next" | "end" | string;

export function isSection(q: Question): boolean {
  return q.type === "section";
}

export function isAnswerable(q: Question): boolean {
  return q.type !== "section";
}

export function surveyHasBranching(questions: Question[]): boolean {
  return questions.some(
    (q) =>
      q.type === "single" &&
      Array.isArray(q.optionGoTo) &&
      q.optionGoTo.some((t) => t && t !== "next")
  );
}

export function getOptionGoTo(q: Question, optionLabel: string): BranchTarget {
  if (q.type !== "single" || !q.options?.length) return "next";
  const idx = q.options.indexOf(optionLabel);
  if (idx < 0) return "next";
  const target = q.optionGoTo?.[idx];
  return target && target.trim() ? target : "next";
}

/**
 * Questions shown to the respondent given current answers.
 * Without any branching configured, returns all questions (current behavior).
 * With branching: walks the path; stops after an unanswered branch point.
 */
export function getVisibleQuestions(
  questions: Question[],
  answers: Record<string, unknown>
): Question[] {
  if (!surveyHasBranching(questions) && !questions.some(isSection)) {
    return questions;
  }

  // Even with only sections (no branches), still show everything in order.
  if (!surveyHasBranching(questions)) {
    return questions;
  }

  const visible: Question[] = [];
  const byId = new Map(questions.map((q) => [q.id, q]));
  let i = 0;
  const visited = new Set<string>();

  while (i >= 0 && i < questions.length) {
    const q = questions[i];
    if (visited.has(q.id)) break; // cycle guard
    visited.add(q.id);
    visible.push(q);

    if (isSection(q)) {
      i += 1;
      continue;
    }

    if (q.type === "single" && Array.isArray(q.optionGoTo) && q.optionGoTo.some((t) => t && t !== "next")) {
      const ans = answers[q.id];
      if (typeof ans !== "string" || !ans) {
        // Wait for this branch answer before revealing further questions
        break;
      }
      const goTo = getOptionGoTo(q, ans);
      if (goTo === "end") break;
      if (goTo === "next") {
        i += 1;
        continue;
      }
      const target = byId.get(goTo);
      if (!target) {
        i += 1;
        continue;
      }
      i = questions.findIndex((x) => x.id === goTo);
      continue;
    }

    i += 1;
  }

  return visible;
}

/** Drop answers that are no longer on the active path. */
export function pruneAnswersToPath(
  questions: Question[],
  answers: Record<string, string | number | string[] | undefined>
): Record<string, string | number | string[] | undefined> {
  const visibleIds = new Set(getVisibleQuestions(questions, answers).map((q) => q.id));
  const next: Record<string, string | number | string[] | undefined> = {};
  for (const [id, val] of Object.entries(answers)) {
    if (visibleIds.has(id)) next[id] = val;
  }
  return next;
}

export function getMissingRequiredOnPath(
  questions: Question[],
  answers: Record<string, unknown>
): Question[] {
  const visible = getVisibleQuestions(questions, answers).filter(isAnswerable);
  return visible.filter((q) => q.required === true && !isFilled(q, answers[q.id]));
}

function isFilled(q: Question, value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (q.type === "multi") return Array.isArray(value) && value.length > 0;
  if (q.type === "text") return String(value).trim().length > 0;
  if (q.type === "number" || q.type === "rating") return typeof value === "number" && !Number.isNaN(value);
  return value !== "";
}
