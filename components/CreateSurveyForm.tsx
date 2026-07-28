"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2, Send, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { publishSurvey } from "@/lib/actions/survey";
import { INK, OCHRE, RUST, SLATE, Question, QuestionType, uuid } from "@/lib/constants";
import { ENQUETE_TEMPLATE } from "@/lib/templates/enquete";

const QUESTION_TYPES: QuestionType[] = ["single", "multi", "rating", "number", "text"];

function emptyQuestion(): Question {
  return { id: uuid(), type: "single", text: "", options: ["", ""] };
}

interface CreateSurveyFormProps {
  useTemplate?: boolean;
}

export function CreateSurveyForm({ useTemplate = true }: CreateSurveyFormProps) {
  const t = useTranslations("create");
  const router = useRouter();
  const template = useTemplate ? ENQUETE_TEMPLATE : null;

  const [title, setTitle] = useState(template?.title || "");
  const [description, setDescription] = useState(template?.description || "");
  const [questions, setQuestions] = useState<Question[]>(
    template?.questions?.length ? template.questions.map((q) => ({ ...q, id: q.id || uuid() })) : [emptyQuestion()]
  );
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  const updateQ = (id: string, patch: Partial<Question>) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  const removeQ = (id: string) => setQuestions((qs) => qs.filter((q) => q.id !== id));
  const addQ = () => setQuestions((qs) => [...qs, emptyQuestion()]);

  const validate = () => {
    if (!title.trim()) return t("errors.title");
    if (questions.length === 0) return t("errors.questions");
    for (const q of questions) {
      if (!q.text.trim()) return t("errors.questionText");
      if (q.type === "single" || q.type === "multi") {
        const filled = (q.options || []).filter((o) => o.trim());
        if (filled.length < 2) return t("errors.options");
      }
    }
    return "";
  };

  const publish = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setPublishing(true);
    const result = await publishSurvey({ title, description, questions });
    setPublishing(false);
    if (result.error) {
      setError(t("errors.publish"));
      return;
    }
    router.push(`/publie/${result.code}`);
  };

  return (
    <div className="pt-6 pb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="sondage-mono text-xs tracking-widest uppercase" style={{ color: SLATE }}>
          {t("newSurvey")}
        </div>
        {template && (
          <button
            onClick={() => router.push("/creer?blank=1")}
            className="sondage-btn sondage-sans text-xs"
            style={{ color: SLATE }}
          >
            {t("blankSurvey")}
          </button>
        )}
      </div>

      {template && (
        <div className="sondage-sans text-xs mb-4 py-2 px-3" style={{ background: `${OCHRE}18`, color: `${INK}bb` }}>
          {t("templateHint", { count: questions.length })}
        </div>
      )}

      <input
        className="sondage-input text-2xl font-bold"
        placeholder={t("titlePlaceholder")}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="sondage-input sondage-sans text-sm mt-2 resize-none"
        placeholder={t("descriptionPlaceholder")}
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="mt-8 flex flex-col gap-6">
        {questions.map((q, i) => (
          <QuestionEditor
            key={q.id}
            index={i}
            q={q}
            onChange={(patch) => updateQ(q.id, patch)}
            onRemove={() => removeQ(q.id)}
            canRemove={questions.length > 1}
          />
        ))}
      </div>

      <button onClick={addQ} className="sondage-btn sondage-sans flex items-center gap-2 mt-5 text-sm" style={{ color: OCHRE }}>
        <Plus size={16} /> {t("addQuestion")}
      </button>

      {error && (
        <div className="sondage-sans text-sm mt-5 flex items-center gap-2" style={{ color: RUST }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <button
        onClick={publish}
        disabled={publishing}
        className="sondage-btn sondage-sans flex items-center justify-center gap-2 w-full mt-6 py-3 text-sm text-white"
        style={{ background: INK, opacity: publishing ? 0.7 : 1 }}
      >
        {publishing ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
        {publishing ? t("publishing") : t("publish")}
      </button>
    </div>
  );
}

function QuestionEditor({
  index,
  q,
  onChange,
  onRemove,
  canRemove,
}: {
  index: number;
  q: Question;
  onChange: (patch: Partial<Question>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const t = useTranslations("create");

  return (
    <div style={{ borderLeft: `3px solid ${INK}` }} className="pl-4">
      <div className="flex items-start justify-between gap-3">
        <span className="sondage-mono text-xs pt-2" style={{ color: SLATE }}>
          {t("questionLabel", { index: index + 1 })}
        </span>
        <input
          className="sondage-input flex-1"
          placeholder={t("questionPlaceholder")}
          value={q.text}
          onChange={(e) => onChange({ text: e.target.value })}
        />
        {canRemove && (
          <button onClick={onRemove} className="sondage-btn pt-2" style={{ color: SLATE }} aria-label="Remove">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="flex gap-2 mt-3 flex-wrap">
        {QUESTION_TYPES.map((type) => (
          <button
            key={type}
            onClick={() =>
              onChange({
                type,
                options: type === "single" || type === "multi" ? (q.options?.length ? q.options : ["", ""]) : q.options,
              })
            }
            className="sondage-btn sondage-sans text-xs px-2.5 py-1"
            style={{
              border: `1px solid ${q.type === type ? INK : SLATE + "66"}`,
              background: q.type === type ? INK : "transparent",
              color: q.type === type ? "#F7F5EF" : INK,
            }}
          >
            {t(`types.${type}`)}
          </button>
        ))}
      </div>

      {(q.type === "single" || q.type === "multi") && (
        <div className="mt-3 flex flex-col gap-2">
          {(q.options || []).map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="sondage-mono text-xs" style={{ color: SLATE }}>
                {String.fromCharCode(97 + idx)}
              </span>
              <input
                className="sondage-input sondage-sans text-sm"
                placeholder={`Option ${idx + 1}`}
                value={opt}
                onChange={(e) => {
                  const options = (q.options || []).map((o, i) => (i === idx ? e.target.value : o));
                  onChange({ options });
                }}
              />
              {(q.options?.length || 0) > 2 && (
                <button
                  onClick={() => onChange({ options: (q.options || []).filter((_, i) => i !== idx) })}
                  style={{ color: SLATE }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => onChange({ options: [...(q.options || []), ""] })}
            className="sondage-btn sondage-sans text-xs mt-1 self-start"
            style={{ color: OCHRE }}
          >
            {t("addOption")}
          </button>
        </div>
      )}

      {q.type === "rating" && (
        <div className="sondage-sans text-xs mt-2" style={{ color: `${INK}88` }}>
          {t("ratingHint")}
        </div>
      )}

      {q.type === "number" && (
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <label className="sondage-sans text-xs flex items-center gap-1.5" style={{ color: `${INK}88` }}>
            {t("min")}
            <input
              type="number"
              className="sondage-input sondage-mono text-sm"
              style={{ width: 56 }}
              value={q.min ?? ""}
              onChange={(e) => onChange({ min: e.target.value === "" ? undefined : Number(e.target.value) })}
            />
          </label>
          <label className="sondage-sans text-xs flex items-center gap-1.5" style={{ color: `${INK}88` }}>
            {t("max")}
            <input
              type="number"
              className="sondage-input sondage-mono text-sm"
              style={{ width: 56 }}
              value={q.max ?? ""}
              onChange={(e) => onChange({ max: e.target.value === "" ? undefined : Number(e.target.value) })}
            />
          </label>
          <label className="sondage-sans text-xs flex items-center gap-1.5" style={{ color: `${INK}88` }}>
            {t("unit")}
            <input
              type="text"
              className="sondage-input sondage-sans text-sm"
              style={{ width: 72 }}
              placeholder={t("unitPlaceholder")}
              value={q.unit ?? ""}
              onChange={(e) => onChange({ unit: e.target.value })}
            />
          </label>
        </div>
      )}

      {q.type === "text" && (
        <div className="sondage-sans text-xs mt-2" style={{ color: `${INK}88` }}>
          {t("textHint")}
        </div>
      )}
    </div>
  );
}
