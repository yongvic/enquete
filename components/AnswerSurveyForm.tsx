"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Send, Loader2, AlertCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getMissingRequiredQuestions, isQuestionRequired } from "@/lib/answers";
import { getVisibleQuestions, pruneAnswersToPath, surveyHasBranching } from "@/lib/branching";
import { getSurveyByCode, submitResponse } from "@/lib/actions/survey";
import { GREEN, INK, OCHRE, RUST, SLATE, Question, SurveyData } from "@/lib/constants";

interface AnswerSurveyFormProps {
  initialCode?: string;
}

export function AnswerSurveyForm({ initialCode = "" }: AnswerSurveyFormProps) {
  const t = useTranslations("answer");
  const [code, setCode] = useState(initialCode);
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Record<string, string | number | string[] | undefined>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [missingIds, setMissingIds] = useState<string[]>([]);

  useEffect(() => {
    if (initialCode) load(initialCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  const visibleQuestions = useMemo(() => {
    if (!survey) return [];
    return getVisibleQuestions(survey.questions, answers);
  }, [survey, answers]);

  const load = async (forcedCode?: string) => {
    const c = (forcedCode || code).trim().toUpperCase();
    if (!c) return;
    setLoading(true);
    setError("");
    setSurvey(null);
    const data = await getSurveyByCode(c);
    setLoading(false);
    if (!data) {
      setError(t("errors.notFound"));
      return;
    }
    setSurvey({
      ...data,
      code: data.code!,
      questions: data.questions as unknown as Question[],
    });
    setAnswers({});
    setCode(c);
  };

  const setAnswer = (qid: string, val: string | number | string[] | undefined) => {
    setAnswers((a) => {
      const next = { ...a, [qid]: val };
      if (!survey) return next;
      return pruneAnswersToPath(survey.questions, next);
    });
    setMissingIds((ids) => ids.filter((id) => id !== qid));
  };

  const toggleMulti = (qid: string, opt: string) => {
    setAnswers((a) => {
      const cur = (a[qid] as string[]) || [];
      const nextVal = cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt];
      const next = { ...a, [qid]: nextVal };
      if (!survey) return next;
      return pruneAnswersToPath(survey.questions, next);
    });
    setMissingIds((ids) => ids.filter((id) => id !== qid));
  };

  const submit = async () => {
    if (!survey) return;
    const missing = getMissingRequiredQuestions(survey.questions, answers);
    if (missing.length > 0) {
      setMissingIds(missing.map((q) => q.id));
      setError(t("errors.required", { count: missing.length }));
      const first = document.getElementById(`q-${missing[0].id}`);
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setMissingIds([]);
    setSubmitting(true);
    setError("");
    const payload = pruneAnswersToPath(survey.questions, answers);
    const result = await submitResponse(survey.code, payload);
    setSubmitting(false);
    if (result.error) {
      setError(t("errors.submit"));
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="pt-16 flex flex-col items-center text-center">
        <Check size={28} style={{ color: GREEN }} />
        <h2 className="text-2xl font-bold mt-4">{t("thanks")}</h2>
        <p className="sondage-sans text-sm mt-2" style={{ color: `${INK}99` }}>
          {t("thanksDesc")}
        </p>
        <Link
          href="/"
          className="sondage-btn sondage-sans mt-8 py-2.5 px-6 text-sm text-white inline-block"
          style={{ background: INK }}
        >
          {t("backHome")}
        </Link>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="pt-6">
        <div className="sondage-mono text-xs tracking-widest uppercase mb-2" style={{ color: SLATE }}>
          {t("title")}
        </div>
        <h1 className="text-2xl font-bold">{t("enterCode")}</h1>
        <div className="flex gap-2 mt-5">
          <input
            className="sondage-input sondage-mono text-xl tracking-widest text-center"
            placeholder="ABCDE"
            maxLength={8}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
        </div>
        <button
          onClick={() => load()}
          disabled={loading}
          className="sondage-btn sondage-sans w-full mt-4 py-3 text-sm text-white flex items-center justify-center gap-2"
          style={{ background: INK, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : t("load")}
        </button>
        {error && (
          <div className="sondage-sans text-sm mt-4 flex items-center gap-2" style={{ color: RUST }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}
      </div>
    );
  }

  const branched = surveyHasBranching(survey.questions);

  return (
    <div className="pt-6">
      <div className="sondage-mono text-xs tracking-widest uppercase mb-2" style={{ color: SLATE }}>
        {survey.code}
      </div>
      <h1 className="text-2xl font-bold">{survey.title}</h1>
      {survey.description && (
        <p className="sondage-sans text-sm mt-2" style={{ color: `${INK}99` }}>
          {survey.description}
        </p>
      )}
      {branched && (
        <p className="sondage-sans text-xs mt-3" style={{ color: `${INK}88` }}>
          {t("branchNote")}
        </p>
      )}

      <div className="flex flex-col gap-7 mt-7">
        {visibleQuestions.map((q) => {
          const originalIndex = survey.questions.findIndex((item) => item.id === q.id);
          const isMissing = missingIds.includes(q.id);

          if (q.type === "section") {
            return (
              <div key={q.id} id={`q-${q.id}`} className="pt-1">
                <div className="sondage-mono text-xs tracking-widest uppercase mb-1" style={{ color: OCHRE }}>
                  {t("section")}
                </div>
                <h2 className="font-bold text-lg">{q.text}</h2>
              </div>
            );
          }

          return (
            <div
              key={q.id}
              id={`q-${q.id}`}
              className={`scroll-mt-4 ${isMissing ? "sondage-question-missing" : ""}`}
            >
              <div className="sondage-sans font-semibold text-[15px] leading-snug">
                <span className="sondage-mono text-xs mr-2" style={{ color: SLATE }}>
                  Q{originalIndex + 1}
                </span>
                <span className={isMissing ? "sondage-question-text-error" : undefined}>{q.text}</span>
                {isQuestionRequired(q) ? (
                  <span className="sondage-required-badge sondage-required-badge--yes">{t("required")}</span>
                ) : (
                  <span className="sondage-required-badge sondage-required-badge--no">{t("optional")}</span>
                )}
              </div>
              <div className="mt-3">
                {q.type === "single" &&
                  (q.options || []).map((opt) => (
                    <label
                      key={opt}
                      className="sondage-option flex items-center gap-2.5 py-2 cursor-pointer sondage-sans text-sm"
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={answers[q.id] === opt}
                        onChange={() => setAnswer(q.id, opt)}
                      />
                      {opt}
                    </label>
                  ))}
                {q.type === "multi" &&
                  (q.options || []).map((opt) => (
                    <label
                      key={opt}
                      className="sondage-option flex items-center gap-2.5 py-2 cursor-pointer sondage-sans text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={((answers[q.id] as string[]) || []).includes(opt)}
                        onChange={() => toggleMulti(q.id, opt)}
                      />
                      {opt}
                    </label>
                  ))}
                {q.type === "rating" && (
                  <div className="flex gap-2 flex-wrap">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setAnswer(q.id, n)}
                        className="sondage-btn sondage-mono w-11 h-11 sm:w-10 sm:h-10 text-sm"
                        style={{
                          border: `1px solid ${INK}`,
                          background: answers[q.id] === n ? INK : "transparent",
                          color: answers[q.id] === n ? "#F7F5EF" : INK,
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}
                {q.type === "number" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={q.min}
                      max={q.max}
                      className="sondage-input sondage-mono text-sm max-w-[140px]"
                      style={{ width: "100%" }}
                      placeholder="0"
                      value={answers[q.id] ?? ""}
                      onChange={(e) =>
                        setAnswer(q.id, e.target.value === "" ? undefined : Number(e.target.value))
                      }
                    />
                    {q.unit && (
                      <span className="sondage-sans text-sm" style={{ color: `${INK}88` }}>
                        {q.unit}
                      </span>
                    )}
                  </div>
                )}
                {q.type === "text" && (
                  <textarea
                    className="sondage-input sondage-sans text-sm resize-none"
                    rows={3}
                    placeholder={t("placeholder")}
                    value={(answers[q.id] as string) || ""}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="sondage-sans text-sm mt-5 flex items-center gap-2" style={{ color: RUST }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={submitting}
        className="sondage-btn sondage-sans flex items-center justify-center gap-2 w-full mt-7 py-3 text-sm text-white"
        style={{ background: INK, opacity: submitting ? 0.7 : 1 }}
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
        {submitting ? t("submitting") : t("submit")}
      </button>
    </div>
  );
}
