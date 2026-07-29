"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  Trash2,
  Send,
  Loader2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  FileText,
  ClipboardList,
  Save,
  Asterisk,
  BookOpen,
} from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { publishSurvey, saveDraft, updatePublishedSurvey } from "@/lib/actions/survey";
import { loadEnqueteTemplateForUser } from "@/lib/actions/template";
import { INK, OCHRE, RUST, SLATE, Question, QuestionType, uuid } from "@/lib/constants";

const QUESTION_TYPES: QuestionType[] = ["single", "multi", "rating", "number", "text"];

function emptyQuestion(): Question {
  return { id: uuid(), type: "single", text: "", options: ["", ""], required: false };
}

type WizardStep = "start" | "info" | "questions" | "preview";

interface DraftSummary {
  id: string;
  title: string;
  createdAt: Date;
}

interface SurveyWizardProps {
  drafts?: DraftSummary[];
  canUseTemplate?: boolean;
  initialDraft?: {
    id: string;
    title: string;
    description?: string | null;
    questions: Question[];
  } | null;
  initialPublished?: {
    id: string;
    code: string;
    title: string;
    description?: string | null;
    questions: Question[];
    responseCount: number;
  } | null;
}

export function SurveyWizard({
  drafts = [],
  canUseTemplate = false,
  initialDraft = null,
  initialPublished = null,
}: SurveyWizardProps) {
  const t = useTranslations("wizard");
  const tc = useTranslations("create");
  const router = useRouter();

  const editingPublished = !!initialPublished;
  const initial = initialPublished || initialDraft;

  const [step, setStep] = useState<WizardStep>(initial ? "info" : "start");
  const [surveyId, setSurveyId] = useState<string | undefined>(initial?.id);
  const [publishedCode] = useState(initialPublished?.code);
  const [responseCount] = useState(initialPublished?.responseCount ?? 0);
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [questions, setQuestions] = useState<Question[]>(
    initial?.questions?.length ? initial.questions : [emptyQuestion()]
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedHint, setSavedHint] = useState(false);

  const updateQ = (id: string, patch: Partial<Question>) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  const removeQ = (id: string) => setQuestions((qs) => qs.filter((q) => q.id !== id));
  const addQ = () => setQuestions((qs) => [...qs, emptyQuestion()]);

  const validate = () => {
    if (!title.trim()) return tc("errors.title");
    if (questions.length === 0) return tc("errors.questions");
    for (const q of questions) {
      if (!q.text.trim()) return tc("errors.questionText");
      if (q.type === "single" || q.type === "multi") {
        const filled = (q.options || []).filter((o) => o.trim());
        if (filled.length < 2) return tc("errors.options");
      }
    }
    return "";
  };

  const startBlank = () => {
    setTitle("");
    setDescription("");
    setQuestions([emptyQuestion()]);
    setSurveyId(undefined);
    setStep("info");
  };

  const startTemplate = async () => {
    setBusy(true);
    setError("");
    const result = await loadEnqueteTemplateForUser();
    setBusy(false);
    if (result.error || !result.template) {
      setError(t("templateForbidden"));
      return;
    }
    const template = result.template;
    setTitle(template.title);
    setDescription(template.description);
    setQuestions(template.questions.map((q) => ({ ...q, id: uuid() })));
    setSurveyId(undefined);
    setStep("info");
  };

  const loadDraft = (id: string) => {
    router.push(`/creer?draft=${id}`);
  };

  const persistDraft = async () => {
    if (!title.trim()) {
      setError(tc("errors.title"));
      return false;
    }
    setBusy(true);
    setError("");
    if (editingPublished && surveyId) {
      const result = await updatePublishedSurvey({ surveyId, title, description, questions });
      setBusy(false);
      if (result.error) {
        setError(tc("errors.publish"));
        return false;
      }
      setSavedHint(true);
      setTimeout(() => setSavedHint(false), 2000);
      return true;
    }
    const result = await saveDraft({ draftId: surveyId, title, description, questions });
    setBusy(false);
    if (result.error) {
      setError(tc("errors.publish"));
      return false;
    }
    setSurveyId(result.draftId);
    setSavedHint(true);
    setTimeout(() => setSavedHint(false), 2000);
    return true;
  };

  const publish = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setBusy(true);
    setError("");
    if (editingPublished && surveyId) {
      const result = await updatePublishedSurvey({ surveyId, title, description, questions });
      setBusy(false);
      if (result.error) {
        setError(tc("errors.publish"));
        return;
      }
      router.push(`/resultats/${result.code}`);
      return;
    }
    const result = await publishSurvey({ draftId: surveyId, title, description, questions });
    setBusy(false);
    if (result.error) {
      setError(tc("errors.publish"));
      return;
    }
    router.push(`/publie/${result.code}`);
  };

  const steps: WizardStep[] = ["start", "info", "questions", "preview"];
  const stepIndex = steps.indexOf(step);

  return (
    <div className="pt-6 pb-8">
      {editingPublished && step !== "start" && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{t("editPublishedTitle")}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="sondage-mono text-xs tracking-widest" style={{ color: OCHRE }}>
              {publishedCode}
            </span>
            {responseCount > 0 && (
              <span className="sondage-sans text-xs" style={{ color: SLATE }}>
                {t("editPublishedResponses", { count: responseCount })}
              </span>
            )}
          </div>
          {responseCount > 0 && (
            <p className="sondage-sans text-xs mt-3 py-2 px-3" style={{ background: `${OCHRE}15`, color: `${INK}bb` }}>
              {t("editPublishedNote")}
            </p>
          )}
        </div>
      )}

      {step !== "start" && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            {["info", "questions", "preview"].map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className="sondage-mono text-xs w-7 h-7 flex items-center justify-center shrink-0"
                  style={{
                    border: `1px solid ${stepIndex > i ? INK : SLATE + "66"}`,
                    background: stepIndex > i ? INK : step === s ? INK : "transparent",
                    color: stepIndex > i || step === s ? "#F7F5EF" : INK,
                  }}
                >
                  {i + 1}
                </div>
                {i < 2 && <div className="h-px flex-1" style={{ background: `${SLATE}44` }} />}
              </div>
            ))}
          </div>
          <div className="sondage-sans text-xs" style={{ color: SLATE }}>
            {t(`steps.${step}`)}
          </div>
        </div>
      )}

      {step === "start" && (
        <div>
          <h1 className="text-2xl font-bold">{t("startTitle")}</h1>
          <p className="sondage-sans text-sm mt-2" style={{ color: `${INK}99` }}>
            {t("startSubtitle")}
          </p>
          <div className="grid gap-3 mt-8">
            <button
              onClick={startBlank}
              className="sondage-btn text-left p-5 w-full"
              style={{ border: `2px solid ${INK}` }}
            >
              <FileText size={20} style={{ color: OCHRE }} />
              <div className="mt-3 font-bold">{t("blank")}</div>
              <div className="sondage-sans text-sm mt-1" style={{ color: `${INK}99` }}>
                {t("blankDesc")}
              </div>
            </button>
            {canUseTemplate ? (
              <button
                onClick={startTemplate}
                disabled={busy}
                className="sondage-btn text-left p-5 w-full"
                style={{ border: `1px solid ${SLATE}55` }}
              >
                <ClipboardList size={20} style={{ color: OCHRE }} />
                <div className="mt-3 font-bold">{t("template")}</div>
                <div className="sondage-sans text-sm mt-1" style={{ color: `${INK}99` }}>
                  {t("templateDesc")}
                </div>
              </button>
            ) : (
              <div
                className="p-5 rounded-sm"
                style={{ border: `1px solid ${SLATE}55`, background: `${SLATE}08` }}
              >
                <BookOpen size={20} style={{ color: OCHRE }} />
                <div className="mt-3 font-bold">{t("guideTitle")}</div>
                <p className="sondage-sans text-sm mt-2" style={{ color: `${INK}99` }}>
                  {t("guideIntro")}
                </p>
                <ol className="sondage-sans text-sm mt-3 flex flex-col gap-2 list-decimal list-inside" style={{ color: INK }}>
                  <li>{t("guideStep1")}</li>
                  <li>{t("guideStep2")}</li>
                  <li>{t("guideStep3")}</li>
                  <li>{t("guideStep4")}</li>
                  <li>{t("guideStep5")}</li>
                </ol>
                <button
                  onClick={startBlank}
                  className="sondage-btn sondage-sans text-sm mt-4 px-4 py-2"
                  style={{ border: `1px solid ${INK}` }}
                >
                  {t("guideCta")}
                </button>
              </div>
            )}
          </div>
          {drafts.length > 0 && (
            <div className="mt-8">
              <div className="sondage-mono text-xs tracking-widest uppercase mb-3" style={{ color: SLATE }}>
                {t("drafts")}
              </div>
              <div className="flex flex-col gap-2">
                {drafts.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => loadDraft(d.id)}
                    className="sondage-btn flex items-center justify-between py-2.5 px-3 text-left"
                    style={{ border: `1px solid ${SLATE}55` }}
                  >
                    <span className="sondage-sans text-sm truncate">{d.title || t("untitledDraft")}</span>
                    <ChevronRight size={14} style={{ color: SLATE }} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {step === "info" && (
        <div>
          <input
            className="sondage-input text-2xl font-bold"
            placeholder={tc("titlePlaceholder")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="sondage-input sondage-sans text-sm mt-4 resize-none"
            placeholder={tc("descriptionPlaceholder")}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      )}

      {step === "questions" && (
        <div className="flex flex-col gap-6">
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
          <button
            onClick={addQ}
            className="sondage-btn sondage-sans flex items-center gap-2 text-sm self-start"
            style={{ color: OCHRE }}
          >
            <Plus size={16} /> {tc("addQuestion")}
          </button>
        </div>
      )}

      {step === "preview" && (
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          {description && (
            <p className="sondage-sans text-sm mt-2" style={{ color: `${INK}99` }}>
              {description}
            </p>
          )}
          <div className="mt-6 flex flex-col gap-4">
            {questions.map((q, i) => (
              <div key={q.id} className="sondage-sans text-sm py-2 border-b" style={{ borderColor: `${SLATE}33` }}>
                <span className="sondage-mono text-xs mr-2" style={{ color: SLATE }}>
                  Q{i + 1}
                </span>
              {q.text}
              {q.required ? (
                <span className="sondage-required-badge sondage-required-badge--yes">{tc("required")}</span>
              ) : (
                <span className="sondage-required-badge sondage-required-badge--no">{tc("optional")}</span>
              )}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="sondage-sans text-sm mt-5 flex items-center gap-2" style={{ color: RUST }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {savedHint && (
        <div className="sondage-sans text-sm mt-3" style={{ color: OCHRE }}>
          {t("draftSaved")}
        </div>
      )}

      {step !== "start" && (
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <button
            onClick={() => {
              if (step === "info") {
                if (editingPublished) router.push("/dashboard");
                else setStep("start");
              } else if (step === "questions") setStep("info");
              else setStep("questions");
            }}
            className="sondage-btn sondage-sans flex items-center justify-center gap-2 py-3 px-4 text-sm"
            style={{ border: `1px solid ${INK}` }}
          >
            <ChevronLeft size={15} /> {t("back")}
          </button>

          {step !== "preview" && (
            <button
              onClick={persistDraft}
              disabled={busy}
              className="sondage-btn sondage-sans flex items-center justify-center gap-2 py-3 px-4 text-sm"
              style={{ border: `1px solid ${SLATE}88` }}
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {editingPublished ? tc("saveChanges") : t("saveDraft")}
            </button>
          )}

          {step === "preview" ? (
            <button
              onClick={publish}
              disabled={busy}
              className="sondage-btn sondage-sans flex-1 flex items-center justify-center gap-2 py-3 text-sm text-white"
              style={{ background: INK, opacity: busy ? 0.7 : 1 }}
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
              {busy
                ? editingPublished
                  ? tc("savingChanges")
                  : tc("publishing")
                : editingPublished
                  ? tc("saveChanges")
                  : tc("publish")}
            </button>
          ) : (
            <button
              onClick={() => {
                if (step === "info") {
                  if (!title.trim()) {
                    setError(tc("errors.title"));
                    return;
                  }
                  setError("");
                  setStep("questions");
                } else {
                  const err = validate();
                  if (err && step === "questions") {
                    setError(err);
                    return;
                  }
                  setError("");
                  setStep("preview");
                }
              }}
              className="sondage-btn sondage-sans flex-1 flex items-center justify-center gap-2 py-3 text-sm text-white"
              style={{ background: INK }}
            >
              {t("continue")} <ChevronRight size={15} />
            </button>
          )}
        </div>
      )}
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
  const tc = useTranslations("create");

  return (
    <div style={{ borderLeft: `3px solid ${INK}` }} className="pl-4">
      <div className="flex items-start justify-between gap-3">
        <span className="sondage-mono text-xs pt-2" style={{ color: SLATE }}>
          {tc("questionLabel", { index: index + 1 })}
        </span>
        <input
          className="sondage-input flex-1"
          placeholder={tc("questionPlaceholder")}
          value={q.text}
          onChange={(e) => onChange({ text: e.target.value })}
        />
        {canRemove && (
          <button onClick={onRemove} className="sondage-btn pt-2" style={{ color: SLATE }}>
            <Trash2 size={16} />
          </button>
        )}
      </div>
      <div className="flex gap-2 mt-3 flex-wrap items-center">
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
            {tc(`types.${type}`)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange({ required: !q.required })}
          className="sondage-btn sondage-sans text-xs px-2.5 py-1.5 flex items-center gap-1 ml-auto sm:ml-0"
          style={{
            border: `1px solid ${q.required ? RUST : SLATE + "66"}`,
            background: q.required ? `${RUST}12` : "transparent",
            color: q.required ? RUST : SLATE,
          }}
          title={q.required ? tc("requiredHint") : tc("optionalHint")}
        >
          <Asterisk size={12} />
          {q.required ? tc("required") : tc("optional")}
        </button>
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
                value={opt}
                onChange={(e) => {
                  const options = (q.options || []).map((o, i) => (i === idx ? e.target.value : o));
                  onChange({ options });
                }}
              />
              {(q.options?.length || 0) > 2 && (
                <button onClick={() => onChange({ options: (q.options || []).filter((_, i) => i !== idx) })}>
                  <Trash2 size={14} style={{ color: SLATE }} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => onChange({ options: [...(q.options || []), ""] })}
            className="sondage-btn sondage-sans text-xs self-start"
            style={{ color: OCHRE }}
          >
            {tc("addOption")}
          </button>
        </div>
      )}
      {q.type === "number" && (
        <div className="flex gap-3 mt-2 flex-wrap">
          <label className="sondage-sans text-xs flex items-center gap-1.5">
            {tc("min")}
            <input
              type="number"
              className="sondage-input sondage-mono text-sm"
              style={{ width: 56 }}
              value={q.min ?? ""}
              onChange={(e) => onChange({ min: e.target.value === "" ? undefined : Number(e.target.value) })}
            />
          </label>
          <label className="sondage-sans text-xs flex items-center gap-1.5">
            {tc("max")}
            <input
              type="number"
              className="sondage-input sondage-mono text-sm"
              style={{ width: 56 }}
              value={q.max ?? ""}
              onChange={(e) => onChange({ max: e.target.value === "" ? undefined : Number(e.target.value) })}
            />
          </label>
          <label className="sondage-sans text-xs flex items-center gap-1.5">
            {tc("unit")}
            <input
              type="text"
              className="sondage-input sondage-sans text-sm"
              style={{ width: 72 }}
              value={q.unit ?? ""}
              onChange={(e) => onChange({ unit: e.target.value })}
            />
          </label>
        </div>
      )}
    </div>
  );
}
