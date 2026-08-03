"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
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
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "@/i18n/navigation";
import { publishSurvey, saveDraft, updatePublishedSurvey } from "@/lib/actions/survey";
import { loadEnqueteTemplateForUser } from "@/lib/actions/template";
import { INK, OCHRE, RUST, SLATE, Question, QuestionType, uuid } from "@/lib/constants";

const QUESTION_TYPES: QuestionType[] = ["single", "multi", "rating", "number", "text", "section"];

function emptyQuestion(): Question {
  return { id: uuid(), type: "single", text: "", options: ["", ""], required: false };
}

function emptySection(): Question {
  return { id: uuid(), type: "section", text: "", required: false };
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
  const addSection = () => setQuestions((qs) => [...qs, emptySection()]);
  const moveQ = (from: number, to: number) =>
    setQuestions((qs) => arrayMove(qs, from, to));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    moveQ(oldIndex, newIndex);
  };

  const validate = () => {
    if (!title.trim()) return tc("errors.title");
    const answerable = questions.filter((q) => q.type !== "section");
    if (answerable.length === 0) return tc("errors.questions");
    const ids = new Set(questions.map((q) => q.id));
    for (const q of questions) {
      if (!q.text.trim()) return tc("errors.questionText");
      if (q.type === "single" || q.type === "multi") {
        const filled = (q.options || []).filter((o) => o.trim());
        if (filled.length < 2) return tc("errors.options");
      }
      if (q.type === "single" && q.optionGoTo) {
        for (const target of q.optionGoTo) {
          if (!target || target === "next" || target === "end") continue;
          if (!ids.has(target)) return tc("errors.branchTarget");
        }
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
        <div className="flex flex-col gap-4">
          <p className="sondage-sans text-xs" style={{ color: SLATE }}>
            {tc("dragHint")}
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-4">
                {questions.map((q, i) => (
                  <SortableQuestionEditor
                    key={q.id}
                    index={i}
                    q={q}
                    allQuestions={questions}
                    onChange={(patch) => updateQ(q.id, patch)}
                    onRemove={() => removeQ(q.id)}
                    canRemove={questions.length > 1}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={addQ}
              className="sondage-btn sondage-sans flex items-center gap-2 text-sm self-start"
              style={{ color: OCHRE }}
            >
              <Plus size={16} /> {tc("addQuestion")}
            </button>
            <button
              onClick={addSection}
              className="sondage-btn sondage-sans flex items-center gap-2 text-sm self-start"
              style={{ color: SLATE }}
            >
              <Plus size={16} /> {tc("addSection")}
            </button>
          </div>
          <p className="sondage-sans text-xs" style={{ color: `${INK}88` }}>
            {tc("branchHint")}
          </p>
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
                {q.type === "section" ? (
                  <>
                    <span className="sondage-mono text-xs mr-2" style={{ color: OCHRE }}>
                      {tc("sectionLabel")}
                    </span>
                    <span className="font-semibold">{q.text}</span>
                  </>
                ) : (
                  <>
                    <span className="sondage-mono text-xs mr-2" style={{ color: SLATE }}>
                      Q{i + 1}
                    </span>
                    {q.text}
                    {q.required ? (
                      <span className="sondage-required-badge sondage-required-badge--yes">{tc("required")}</span>
                    ) : (
                      <span className="sondage-required-badge sondage-required-badge--no">{tc("optional")}</span>
                    )}
                    {q.type === "single" &&
                      q.optionGoTo?.some((t) => t && t !== "next") && (
                        <div className="mt-1 text-xs" style={{ color: `${INK}88` }}>
                          {tc("previewBranchNote")}
                        </div>
                      )}
                  </>
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

function SortableQuestionEditor({
  index,
  q,
  allQuestions,
  onChange,
  onRemove,
  canRemove,
}: {
  index: number;
  q: Question;
  allQuestions: Question[];
  onChange: (patch: Partial<Question>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: q.id,
  });
  const tc = useTranslations("create");

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.88 : 1,
    zIndex: isDragging ? 20 : undefined,
    boxShadow: isDragging ? `0 10px 28px ${INK}22` : undefined,
    background: isDragging ? "#fff" : undefined,
    borderRadius: isDragging ? 6 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <QuestionEditor
        index={index}
        q={q}
        allQuestions={allQuestions}
        onChange={onChange}
        onRemove={onRemove}
        canRemove={canRemove}
        dragHandle={
          <button
            type="button"
            className="sondage-btn p-2 touch-none cursor-grab active:cursor-grabbing"
            style={{ color: SLATE, border: `1px solid ${SLATE}44`, borderRadius: 6 }}
            aria-label={tc("dragHandle")}
            title={tc("dragHandle")}
            {...attributes}
            {...listeners}
          >
            <GripVertical size={16} />
          </button>
        }
      />
    </div>
  );
}

function QuestionEditor({
  index,
  q,
  allQuestions,
  onChange,
  onRemove,
  canRemove,
  dragHandle,
}: {
  index: number;
  q: Question;
  allQuestions: Question[];
  onChange: (patch: Partial<Question>) => void;
  onRemove: () => void;
  canRemove: boolean;
  dragHandle?: ReactNode;
}) {
  const tc = useTranslations("create");
  const isSection = q.type === "section";
  const jumpTargets = allQuestions
    .map((item, i) => ({ item, i }))
    .filter(({ item }) => item.id !== q.id && item.type !== "section");

  const setOptionAt = (idx: number, label: string) => {
    const options = (q.options || []).map((o, i) => (i === idx ? label : o));
    onChange({ options });
  };

  const setGoToAt = (idx: number, goTo: string) => {
    const len = q.options?.length || 0;
    const optionGoTo = Array.from({ length: len }, (_, i) => q.optionGoTo?.[i] || "next");
    optionGoTo[idx] = goTo;
    onChange({ optionGoTo });
  };

  const removeOptionAt = (idx: number) => {
    const options = (q.options || []).filter((_, i) => i !== idx);
    const optionGoTo = q.optionGoTo?.filter((_, i) => i !== idx);
    onChange({ options, optionGoTo });
  };

  const addOption = () => {
    onChange({
      options: [...(q.options || []), ""],
      optionGoTo:
        q.type === "single"
          ? [...(q.optionGoTo || (q.options || []).map(() => "next")), "next"]
          : q.optionGoTo,
    });
  };

  const changeType = (type: QuestionType) => {
    if (type === "section") {
      onChange({
        type,
        options: undefined,
        optionGoTo: undefined,
        required: false,
        min: undefined,
        max: undefined,
        unit: undefined,
      });
      return;
    }
    if (type === "single" || type === "multi") {
      onChange({
        type,
        options: q.options?.length ? q.options : ["", ""],
        optionGoTo: undefined,
        required: q.required,
      });
      return;
    }
    onChange({ type, options: undefined, optionGoTo: undefined });
  };

  return (
    <div
      style={{ borderLeft: `3px solid ${isSection ? OCHRE : INK}` }}
      className="pl-3 sm:pl-4"
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        {dragHandle}
        <span className="sondage-mono text-xs pt-2 shrink-0" style={{ color: SLATE }}>
          {isSection ? tc("sectionLabel") : tc("questionLabel", { index: index + 1 })}
        </span>
        <input
          className="sondage-input flex-1 min-w-0"
          placeholder={isSection ? tc("sectionPlaceholder") : tc("questionPlaceholder")}
          value={q.text}
          onChange={(e) => onChange({ text: e.target.value })}
        />
        {canRemove && (
          <button onClick={onRemove} className="sondage-btn pt-2 shrink-0" style={{ color: SLATE }}>
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="flex gap-2 mt-3 flex-wrap items-center">
        {QUESTION_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => changeType(type)}
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
        {!isSection && (
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
        )}
      </div>

      {isSection && (
        <p className="sondage-sans text-xs mt-2" style={{ color: `${INK}88` }}>
          {tc("sectionHint")}
        </p>
      )}

      {(q.type === "single" || q.type === "multi") && (
        <div className="mt-3 flex flex-col gap-2">
          {(q.options || []).map((opt, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="sondage-mono text-xs" style={{ color: SLATE }}>
                  {String.fromCharCode(97 + idx)}
                </span>
                <input
                  className="sondage-input sondage-sans text-sm flex-1 min-w-0"
                  value={opt}
                  onChange={(e) => setOptionAt(idx, e.target.value)}
                />
                {(q.options?.length || 0) > 2 && (
                  <button type="button" onClick={() => removeOptionAt(idx)}>
                    <Trash2 size={14} style={{ color: SLATE }} />
                  </button>
                )}
              </div>
              {q.type === "single" && (
                <label className="sondage-sans text-xs flex items-center gap-1.5 shrink-0 w-full sm:w-auto sm:max-w-[240px]">
                  <span className="shrink-0" style={{ color: SLATE }}>
                    {tc("goTo")}
                  </span>
                  <select
                    className="sondage-input sondage-sans text-xs py-1 min-w-0 flex-1"
                    value={q.optionGoTo?.[idx] || "next"}
                    onChange={(e) => setGoToAt(idx, e.target.value)}
                  >
                    <option value="next">{tc("goToNext")}</option>
                    <option value="end">{tc("goToEnd")}</option>
                    {jumpTargets.map(({ item, i }) => (
                      <option key={item.id} value={item.id}>
                        {tc("goToQuestion", {
                          index: i + 1,
                          text: item.text.trim() || tc("untitledQuestion"),
                        })}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          ))}
          <button
            onClick={addOption}
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
              style={{ width: 80 }}
              placeholder={tc("unitPlaceholder")}
              value={q.unit ?? ""}
              onChange={(e) => onChange({ unit: e.target.value || undefined })}
            />
          </label>
        </div>
      )}
      {q.type === "rating" && (
        <p className="sondage-sans text-xs mt-2" style={{ color: `${INK}88` }}>
          {tc("ratingHint")}
        </p>
      )}
      {q.type === "text" && (
        <p className="sondage-sans text-xs mt-2" style={{ color: `${INK}88` }}>
          {tc("textHint")}
        </p>
      )}
    </div>
  );
}
