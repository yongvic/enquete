import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { Plus, Trash2, Ticket, ClipboardList, BarChart3, Send, ArrowLeft, Copy, Check, Loader2, AlertCircle } from "lucide-react";

const INK = "#1E2A38";
const PAPER = "#F7F5EF";
const OCHRE = "#C9971C";
const SLATE = "#8B96A5";
const GREEN = "#4F7942";
const RUST = "#A63446";
const PALETTE = [INK, OCHRE, GREEN, RUST, SLATE, "#6B4C9A"];

const QUESTION_TYPES = [
  { value: "single", label: "Choix unique" },
  { value: "multi", label: "Choix multiple" },
  { value: "rating", label: "Note (1 à 5)" },
  { value: "number", label: "Nombre" },
  { value: "text", label: "Réponse libre" },
];

const ENQUETE_TEMPLATE = {
  title: "Impact de la prise en charge par appareillage orthopédique des patients atteints de coxarthrose",
  description: "CNAO – Centre National d'Appareillage Orthopédique, Lomé",
  questions: [
    { type: "number", text: "Âge", unit: "ans", min: 0, max: 120 },
    { type: "single", text: "Sexe", options: ["Homme", "Femme"] },
    { type: "text", text: "Profession" },
    { type: "single", text: "Niveau d'instruction", options: ["Aucun", "Primaire", "Secondaire", "Supérieur"] },
    { type: "single", text: "Situation matrimoniale", options: ["Célibataire", "Marié(e)", "Divorcé(e)", "Veuf(ve)"] },
    { type: "text", text: "Lieu de résidence" },

    { type: "single", text: "Ancienneté de la coxarthrose", options: ["<6 mois", "6 mois-1 an", "1-5 ans", ">5 ans"] },
    { type: "single", text: "Hanche atteinte", options: ["Droite", "Gauche", "Bilatérale"] },
    { type: "single", text: "Diagnostic radiographique", options: ["Oui", "Non"] },
    { type: "text", text: "Autres maladies" },

    { type: "single", text: "Appareillage", options: ["Canne simple", "Canne anglaise", "Béquilles", "Déambulateur", "Orthèse", "Autre"] },
    { type: "single", text: "Durée d'utilisation", options: ["<3 mois", "3-6 mois", "6-12 mois", ">1 an"] },
    { type: "single", text: "Utilisation quotidienne", options: ["Oui", "Non"] },
    { type: "single", text: "Respect des conseils", options: ["Toujours", "Souvent", "Rarement", "Jamais"] },

    { type: "number", text: "Douleur avant appareillage (EVA)", unit: "/10", min: 0, max: 10 },
    { type: "number", text: "Douleur après appareillage (EVA)", unit: "/10", min: 0, max: 10 },

    { type: "single", text: "Marche", options: ["Beaucoup améliorée", "Améliorée", "Inchangée", "Dégradée"] },
    { type: "single", text: "Escaliers", options: ["Plus facile", "Identique", "Plus difficile"] },
    { type: "single", text: "Distance parcourue", options: ["Plus", "Même", "Moins"] },
    { type: "single", text: "Activités quotidiennes", options: ["Beaucoup facilitées", "Facilitées", "Inchangées", "Plus difficiles"] },

    { type: "single", text: "Satisfaction", options: ["Très satisfait", "Satisfait", "Peu satisfait", "Pas satisfait"] },
    { type: "single", text: "Recommanderiez-vous l'appareillage ?", options: ["Oui", "Non"] },
    { type: "single", text: "Qualité de vie", options: ["Beaucoup améliorée", "Améliorée", "Inchangée", "Dégradée"] },
    { type: "text", text: "Difficultés rencontrées" },
  ].map((q) => ({ id: uuid(), ...q })),
};

function makeId(len = 5) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function safeGet(key, shared) {
  try {
    const res = await window.storage.get(key, shared);
    return res ? res.value : null;
  } catch {
    return null;
  }
}

export default function SondageApp() {
  const [view, setView] = useState({ name: "create", template: ENQUETE_TEMPLATE });
  const [myCodes, setMyCodes] = useState([]);

  useEffect(() => {
    (async () => {
      const raw = await safeGet("mes-sondages", false);
      if (raw) {
        try {
          setMyCodes(JSON.parse(raw));
        } catch {}
      }
    })();
  }, []);

  const registerOwnSurvey = useCallback(async (id, title) => {
    setMyCodes((prev) => {
      const next = [{ id, title, createdAt: Date.now() }, ...prev.filter((s) => s.id !== id)].slice(0, 20);
      window.storage.set("mes-sondages", JSON.stringify(next), false).catch(() => {});
      return next;
    });
  }, []);

  return (
    <div
      style={{ background: PAPER, color: INK, minHeight: "600px", fontFamily: "'Georgia', 'Iowan Old Style', serif" }}
      className="w-full rounded-sm"
    >
      <style>{`
        .sondage-mono { font-family: 'Courier New', monospace; }
        .sondage-sans { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
        .sondage-input {
          background: transparent;
          border: none;
          border-bottom: 1px solid ${SLATE};
          padding: 8px 2px;
          width: 100%;
          font-size: 15px;
          color: ${INK};
          outline: none;
          transition: border-color .15s ease;
        }
        .sondage-input:focus { border-bottom: 2px solid ${INK}; padding-bottom: 7px; }
        .sondage-btn {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
          font-weight: 600;
          letter-spacing: .02em;
          cursor: pointer;
          transition: transform .1s ease, opacity .15s ease;
        }
        .sondage-btn:active { transform: scale(0.98); }
        .sondage-btn:focus-visible, .sondage-input:focus-visible, .sondage-option:focus-visible {
          outline: 2px solid ${OCHRE};
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .sondage-btn, * { transition: none !important; animation: none !important; }
        }
      `}</style>

      <Header view={view} setView={setView} />

      <div className="px-5 sm:px-8 pb-10 pt-2 max-w-2xl mx-auto">
        {view === "home" && <Home setView={setView} myCodes={myCodes} />}
        {(view === "create" || (typeof view === "object" && view.name === "create")) && (
          <CreateSurvey
            key={typeof view === "object" && view.template ? "template" : "blank"}
            template={typeof view === "object" ? view.template : null}
            onDone={(id, title) => { registerOwnSurvey(id, title); setView({ name: "created", id }); }}
            setView={setView}
          />
        )}
        {typeof view === "object" && view.name === "created" && <CreatedTicket id={view.id} setView={setView} />}
        {view === "answer" && <AnswerSurvey setView={setView} />}
        {view === "results" && <Results setView={setView} myCodes={myCodes} />}
      </div>
    </div>
  );
}

function Header({ view, setView }) {
  const name = typeof view === "string" ? view : view.name;
  return (
    <div className="px-5 sm:px-8 pt-6 pb-4" style={{ borderBottom: `1px solid ${SLATE}44` }}>
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        <button
          className="sondage-btn sondage-sans flex items-center gap-1.5 text-sm"
          style={{ color: name === "home" ? SLATE : INK, opacity: name === "home" ? 0.5 : 1 }}
          onClick={() => setView("home")}
          disabled={name === "home"}
        >
          {name !== "home" && <ArrowLeft size={15} />}
          <span className="sondage-mono text-xs tracking-widest uppercase">Sondages</span>
        </button>
        <span className="sondage-mono text-[11px] tracking-widest uppercase" style={{ color: SLATE }}>
          Sans compte
        </span>
      </div>
    </div>
  );
}

function Home({ setView, myCodes }) {
  return (
    <div className="pt-6">
      <h1 className="text-3xl sm:text-4xl font-bold leading-tight" style={{ letterSpacing: "-0.01em" }}>
        Créez un sondage.<br />Lisez les résultats.
      </h1>
      <p className="sondage-sans text-[15px] mt-3 leading-relaxed" style={{ color: `${INK}bb` }}>
        Aucun compte, aucune inscription. Chaque sondage reçoit un code à 5 lettres —
        partagez-le pour collecter des réponses, gardez-le pour consulter les statistiques.
      </p>

      <div className="grid sm:grid-cols-2 gap-3 mt-8">
        <ActionCard
          icon={<Plus size={20} />}
          title="Créer un sondage"
          desc="Composez vos questions et publiez"
          onClick={() => setView("create")}
        />
        <ActionCard
          icon={<ClipboardList size={20} />}
          title="Répondre"
          desc="Entrez un code pour participer"
          onClick={() => setView("answer")}
        />
        <ActionCard
          icon={<BarChart3 size={20} />}
          title="Voir les résultats"
          desc="Statistiques et graphiques"
          onClick={() => setView("results")}
          full
        />
      </div>

      {myCodes.length > 0 && (
        <div className="mt-10">
          <div className="sondage-mono text-xs tracking-widest uppercase mb-3" style={{ color: SLATE }}>
            Vos sondages récents
          </div>
          <div className="flex flex-col gap-2">
            {myCodes.map((s) => (
              <button
                key={s.id}
                onClick={() => setView({ name: "created", id: s.id })}
                className="sondage-btn sondage-option flex items-center justify-between py-2.5 px-3 text-left"
                style={{ border: `1px solid ${SLATE}55`, background: "transparent" }}
              >
                <span className="sondage-sans text-sm truncate pr-3">{s.title || "Sans titre"}</span>
                <span className="sondage-mono text-xs tracking-widest" style={{ color: OCHRE }}>{s.id}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionCard({ icon, title, desc, onClick, full }) {
  return (
    <button
      onClick={onClick}
      className={`sondage-btn text-left p-5 ${full ? "sm:col-span-2" : ""}`}
      style={{ border: `1px solid ${INK}`, background: "transparent" }}
    >
      <div style={{ color: OCHRE }}>{icon}</div>
      <div className="mt-3 font-bold text-[17px]">{title}</div>
      <div className="sondage-sans text-[13px] mt-1" style={{ color: `${INK}99` }}>{desc}</div>
    </button>
  );
}

// ---------- CREATE ----------

function emptyQuestion() {
  return { id: uuid(), type: "single", text: "", options: ["", ""] };
}

function CreateSurvey({ onDone, setView, template }) {
  const [title, setTitle] = useState(template?.title || "");
  const [description, setDescription] = useState(template?.description || "");
  const [questions, setQuestions] = useState(
    template?.questions?.length ? template.questions.map((q) => ({ ...q, id: q.id || uuid() })) : [emptyQuestion()]
  );
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  const updateQ = (id, patch) => setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  const removeQ = (id) => setQuestions((qs) => qs.filter((q) => q.id !== id));
  const addQ = () => setQuestions((qs) => [...qs, emptyQuestion()]);

  const updateOption = (qid, idx, val) =>
    updateQ(qid, {
      options: questions.find((q) => q.id === qid).options.map((o, i) => (i === idx ? val : o)),
    });
  const addOption = (qid) => {
    const q = questions.find((q) => q.id === qid);
    updateQ(qid, { options: [...q.options, ""] });
  };
  const removeOption = (qid, idx) => {
    const q = questions.find((q) => q.id === qid);
    updateQ(qid, { options: q.options.filter((_, i) => i !== idx) });
  };

  const validate = () => {
    if (!title.trim()) return "Donnez un titre à votre sondage.";
    if (questions.length === 0) return "Ajoutez au moins une question.";
    for (const q of questions) {
      if (!q.text.trim()) return "Chaque question doit avoir un intitulé.";
      if ((q.type === "single" || q.type === "multi")) {
        const filled = q.options.filter((o) => o.trim());
        if (filled.length < 2) return "Chaque question à choix doit avoir au moins 2 options.";
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
    const id = makeId(5);
    const survey = {
      id,
      title: title.trim(),
      description: description.trim(),
      questions: questions.map((q) => ({
        ...q,
        options: (q.type === "single" || q.type === "multi") ? q.options.filter((o) => o.trim()) : undefined,
      })),
      createdAt: Date.now(),
    };
    try {
      await window.storage.set(`survey:${id}`, JSON.stringify(survey), true);
      onDone(id, survey.title);
    } catch (e) {
      setError("Échec de la publication. Réessayez.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="pt-6 pb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="sondage-mono text-xs tracking-widest uppercase" style={{ color: SLATE }}>Nouveau sondage</div>
        {template && (
          <button
            onClick={() => setView("create")}
            className="sondage-btn sondage-sans text-xs"
            style={{ color: SLATE }}
          >
            repartir d'un sondage vierge
          </button>
        )}
      </div>
      {template && (
        <div className="sondage-sans text-xs mb-4 py-2 px-3" style={{ background: `${OCHRE}18`, color: `${INK}bb` }}>
          Pré-rempli à partir de votre fiche d'enquête — {questions.length} questions. Relisez, ajustez si besoin, puis publiez.
        </div>
      )}
      <input
        className="sondage-input text-2xl font-bold"
        placeholder="Titre du sondage"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="sondage-input sondage-sans text-sm mt-2 resize-none"
        placeholder="Description (facultatif)"
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
            onOptionChange={(idx, val) => updateOption(q.id, idx, val)}
            onAddOption={() => addOption(q.id)}
            onRemoveOption={(idx) => removeOption(q.id, idx)}
            canRemove={questions.length > 1}
          />
        ))}
      </div>

      <button onClick={addQ} className="sondage-btn sondage-sans flex items-center gap-2 mt-5 text-sm" style={{ color: OCHRE }}>
        <Plus size={16} /> Ajouter une question
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
        {publishing ? "Publication…" : "Publier le sondage"}
      </button>
    </div>
  );
}

function QuestionEditor({ index, q, onChange, onRemove, onOptionChange, onAddOption, onRemoveOption, canRemove }) {
  return (
    <div style={{ borderLeft: `3px solid ${INK}` }} className="pl-4">
      <div className="flex items-start justify-between gap-3">
        <span className="sondage-mono text-xs pt-2" style={{ color: SLATE }}>Q{index + 1}</span>
        <input
          className="sondage-input flex-1"
          placeholder="Intitulé de la question"
          value={q.text}
          onChange={(e) => onChange({ text: e.target.value })}
        />
        {canRemove && (
          <button onClick={onRemove} className="sondage-btn pt-2" style={{ color: SLATE }} aria-label="Supprimer la question">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="flex gap-2 mt-3 flex-wrap">
        {QUESTION_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => onChange({ type: t.value, options: t.value === "single" || t.value === "multi" ? (q.options?.length ? q.options : ["", ""]) : q.options })}
            className="sondage-btn sondage-sans text-xs px-2.5 py-1"
            style={{
              border: `1px solid ${q.type === t.value ? INK : SLATE + "66"}`,
              background: q.type === t.value ? INK : "transparent",
              color: q.type === t.value ? PAPER : INK,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(q.type === "single" || q.type === "multi") && (
        <div className="mt-3 flex flex-col gap-2">
          {(q.options || []).map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="sondage-mono text-xs" style={{ color: SLATE }}>{String.fromCharCode(97 + idx)}</span>
              <input
                className="sondage-input sondage-sans text-sm"
                placeholder={`Option ${idx + 1}`}
                value={opt}
                onChange={(e) => onOptionChange(idx, e.target.value)}
              />
              {q.options.length > 2 && (
                <button onClick={() => onRemoveOption(idx)} style={{ color: SLATE }} aria-label="Supprimer l'option">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          <button onClick={onAddOption} className="sondage-btn sondage-sans text-xs mt-1 self-start" style={{ color: OCHRE }}>
            + option
          </button>
        </div>
      )}
      {q.type === "rating" && (
        <div className="sondage-sans text-xs mt-2" style={{ color: `${INK}88` }}>Les répondants noteront de 1 (faible) à 5 (élevé).</div>
      )}
      {q.type === "number" && (
        <div className="flex items-center gap-3 mt-2">
          <label className="sondage-sans text-xs flex items-center gap-1.5" style={{ color: `${INK}88` }}>
            min
            <input
              type="number"
              className="sondage-input sondage-mono text-sm"
              style={{ width: 56 }}
              value={q.min ?? ""}
              onChange={(e) => onChange({ min: e.target.value === "" ? undefined : Number(e.target.value) })}
            />
          </label>
          <label className="sondage-sans text-xs flex items-center gap-1.5" style={{ color: `${INK}88` }}>
            max
            <input
              type="number"
              className="sondage-input sondage-mono text-sm"
              style={{ width: 56 }}
              value={q.max ?? ""}
              onChange={(e) => onChange({ max: e.target.value === "" ? undefined : Number(e.target.value) })}
            />
          </label>
          <label className="sondage-sans text-xs flex items-center gap-1.5" style={{ color: `${INK}88` }}>
            unité
            <input
              type="text"
              className="sondage-input sondage-sans text-sm"
              style={{ width: 72 }}
              placeholder="ans, /10…"
              value={q.unit ?? ""}
              onChange={(e) => onChange({ unit: e.target.value })}
            />
          </label>
        </div>
      )}
      {q.type === "text" && (
        <div className="sondage-sans text-xs mt-2" style={{ color: `${INK}88` }}>Réponse en texte libre.</div>
      )}
    </div>
  );
}

// ---------- CREATED TICKET ----------

function CreatedTicket({ id, setView }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <div className="pt-10 flex flex-col items-center text-center">
      <Ticket size={28} style={{ color: OCHRE }} />
      <h2 className="text-2xl font-bold mt-4">Sondage publié</h2>
      <p className="sondage-sans text-sm mt-2" style={{ color: `${INK}99` }}>
        Partagez ce code pour recueillir des réponses. Gardez-le pour consulter les résultats.
      </p>

      <div
        className="mt-6 px-8 py-5"
        style={{ border: `2px dashed ${INK}`, background: "transparent" }}
      >
        <div className="sondage-mono text-4xl tracking-[0.3em] font-bold">{id}</div>
      </div>

      <button onClick={copy} className="sondage-btn sondage-sans flex items-center gap-2 mt-4 text-sm" style={{ color: OCHRE }}>
        {copied ? <Check size={15} /> : <Copy size={15} />}
        {copied ? "Copié" : "Copier le code"}
      </button>

      <div className="flex gap-3 mt-8 w-full">
        <button
          onClick={() => setView("answer")}
          className="sondage-btn sondage-sans flex-1 py-2.5 text-sm"
          style={{ border: `1px solid ${INK}` }}
        >
          Tester la réponse
        </button>
        <button
          onClick={() => setView("results")}
          className="sondage-btn sondage-sans flex-1 py-2.5 text-sm text-white"
          style={{ background: INK }}
        >
          Voir les résultats
        </button>
      </div>
    </div>
  );
}

// ---------- ANSWER ----------

function AnswerSurvey({ setView }) {
  const [code, setCode] = useState("");
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const load = async () => {
    const c = code.trim().toUpperCase();
    if (!c) return;
    setLoading(true);
    setError("");
    setSurvey(null);
    const raw = await safeGet(`survey:${c}`, true);
    setLoading(false);
    if (!raw) {
      setError("Aucun sondage trouvé pour ce code.");
      return;
    }
    try {
      const s = JSON.parse(raw);
      setSurvey(s);
      setAnswers({});
    } catch {
      setError("Ce sondage est illisible.");
    }
  };

  const setAnswer = (qid, val) => setAnswers((a) => ({ ...a, [qid]: val }));
  const toggleMulti = (qid, opt) =>
    setAnswers((a) => {
      const cur = a[qid] || [];
      const next = cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt];
      return { ...a, [qid]: next };
    });

  const submit = async () => {
    setSubmitting(true);
    const response = { surveyId: survey.id, answers, submittedAt: Date.now() };
    try {
      await window.storage.set(`resp:${survey.id}:${uuid()}`, JSON.stringify(response), true);
      setSubmitted(true);
    } catch {
      setError("Échec de l'envoi. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="pt-16 flex flex-col items-center text-center">
        <Check size={28} style={{ color: GREEN }} />
        <h2 className="text-2xl font-bold mt-4">Merci !</h2>
        <p className="sondage-sans text-sm mt-2" style={{ color: `${INK}99` }}>Votre réponse a été enregistrée.</p>
        <button onClick={() => setView("home")} className="sondage-btn sondage-sans mt-8 py-2.5 px-6 text-sm text-white" style={{ background: INK }}>
          Retour à l'accueil
        </button>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="pt-6">
        <div className="sondage-mono text-xs tracking-widest uppercase mb-2" style={{ color: SLATE }}>Répondre à un sondage</div>
        <h1 className="text-2xl font-bold">Entrez le code</h1>
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
          onClick={load}
          disabled={loading}
          className="sondage-btn sondage-sans w-full mt-4 py-3 text-sm text-white flex items-center justify-center gap-2"
          style={{ background: INK, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Charger le sondage"}
        </button>
        {error && (
          <div className="sondage-sans text-sm mt-4 flex items-center gap-2" style={{ color: RUST }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pt-6">
      <div className="sondage-mono text-xs tracking-widest uppercase mb-2" style={{ color: SLATE }}>{survey.id}</div>
      <h1 className="text-2xl font-bold">{survey.title}</h1>
      {survey.description && <p className="sondage-sans text-sm mt-2" style={{ color: `${INK}99` }}>{survey.description}</p>}

      <div className="flex flex-col gap-7 mt-7">
        {survey.questions.map((q, i) => (
          <div key={q.id}>
            <div className="sondage-sans font-semibold text-[15px]">
              <span className="sondage-mono text-xs mr-2" style={{ color: SLATE }}>Q{i + 1}</span>
              {q.text}
            </div>
            <div className="mt-3">
              {q.type === "single" &&
                q.options.map((opt) => (
                  <label
                    key={opt}
                    className="sondage-option flex items-center gap-2.5 py-2 cursor-pointer sondage-sans text-sm"
                  >
                    <input type="radio" name={q.id} checked={answers[q.id] === opt} onChange={() => setAnswer(q.id, opt)} />
                    {opt}
                  </label>
                ))}
              {q.type === "multi" &&
                q.options.map((opt) => (
                  <label
                    key={opt}
                    className="sondage-option flex items-center gap-2.5 py-2 cursor-pointer sondage-sans text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={(answers[q.id] || []).includes(opt)}
                      onChange={() => toggleMulti(q.id, opt)}
                    />
                    {opt}
                  </label>
                ))}
              {q.type === "rating" && (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setAnswer(q.id, n)}
                      className="sondage-btn sondage-mono w-10 h-10 text-sm"
                      style={{
                        border: `1px solid ${INK}`,
                        background: answers[q.id] === n ? INK : "transparent",
                        color: answers[q.id] === n ? PAPER : INK,
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
                    className="sondage-input sondage-mono text-sm"
                    style={{ width: 100 }}
                    placeholder="0"
                    value={answers[q.id] ?? ""}
                    onChange={(e) => setAnswer(q.id, e.target.value === "" ? undefined : Number(e.target.value))}
                  />
                  {q.unit && <span className="sondage-sans text-sm" style={{ color: `${INK}88` }}>{q.unit}</span>}
                </div>
              )}
              {q.type === "text" && (
                <textarea
                  className="sondage-input sondage-sans text-sm resize-none"
                  rows={3}
                  placeholder="Votre réponse…"
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                />
              )}
            </div>
          </div>
        ))}
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
        {submitting ? "Envoi…" : "Envoyer ma réponse"}
      </button>
    </div>
  );
}

// ---------- RESULTS ----------

function Results({ setView, myCodes }) {
  const [code, setCode] = useState("");
  const [survey, setSurvey] = useState(null);
  const [responses, setResponses] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async (forceCode) => {
    const c = (forceCode || code).trim().toUpperCase();
    if (!c) return;
    setLoading(true);
    setError("");
    setSurvey(null);
    setResponses(null);
    const raw = await safeGet(`survey:${c}`, true);
    if (!raw) {
      setLoading(false);
      setError("Aucun sondage trouvé pour ce code.");
      return;
    }
    let s;
    try {
      s = JSON.parse(raw);
    } catch {
      setLoading(false);
      setError("Ce sondage est illisible.");
      return;
    }
    let keys = [];
    try {
      const listRes = await window.storage.list(`resp:${c}:`, true);
      keys = listRes ? listRes.keys : [];
    } catch {
      keys = [];
    }
    const all = await Promise.all(keys.map((k) => safeGet(k, true)));
    const parsed = all
      .filter(Boolean)
      .map((raw) => {
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    setSurvey(s);
    setResponses(parsed);
    setCode(c);
    setLoading(false);
  };

  if (!survey) {
    return (
      <div className="pt-6">
        <div className="sondage-mono text-xs tracking-widest uppercase mb-2" style={{ color: SLATE }}>Résultats</div>
        <h1 className="text-2xl font-bold">Entrez le code du sondage</h1>
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
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Charger les résultats"}
        </button>
        {error && (
          <div className="sondage-sans text-sm mt-4 flex items-center gap-2" style={{ color: RUST }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {myCodes.length > 0 && (
          <div className="mt-8">
            <div className="sondage-mono text-xs tracking-widest uppercase mb-3" style={{ color: SLATE }}>Accès rapide</div>
            <div className="flex flex-col gap-2">
              {myCodes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => load(s.id)}
                  className="sondage-btn sondage-option flex items-center justify-between py-2.5 px-3 text-left"
                  style={{ border: `1px solid ${SLATE}55` }}
                >
                  <span className="sondage-sans text-sm truncate pr-3">{s.title || "Sans titre"}</span>
                  <span className="sondage-mono text-xs tracking-widest" style={{ color: OCHRE }}>{s.id}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pt-6">
      <div className="sondage-mono text-xs tracking-widest uppercase mb-2" style={{ color: SLATE }}>{survey.id}</div>
      <h1 className="text-2xl font-bold">{survey.title}</h1>
      <p className="sondage-sans text-sm mt-1" style={{ color: `${INK}99` }}>
        {responses.length} réponse{responses.length !== 1 ? "s" : ""} reçue{responses.length !== 1 ? "s" : ""}
      </p>

      {responses.length === 0 ? (
        <div className="mt-10 text-center sondage-sans text-sm" style={{ color: `${INK}88` }}>
          Aucune réponse pour l'instant. Partagez le code <span className="sondage-mono font-bold">{survey.id}</span> pour en collecter.
        </div>
      ) : (
        <div className="flex flex-col gap-9 mt-8">
          {survey.questions.map((q, i) => (
            <QuestionResult key={q.id} q={q} index={i} responses={responses} />
          ))}
        </div>
      )}

      <button
        onClick={() => setSurvey(null)}
        className="sondage-btn sondage-sans mt-10 text-sm flex items-center gap-1.5"
        style={{ color: SLATE }}
      >
        <ArrowLeft size={14} /> Autre sondage
      </button>
    </div>
  );
}

function QuestionResult({ q, index, responses }) {
  if (q.type === "text") {
    const texts = responses.map((r) => r.answers?.[q.id]).filter((t) => t && String(t).trim());
    return (
      <div>
        <QLabel index={index} text={q.text} />
        {texts.length === 0 ? (
          <div className="sondage-sans text-sm mt-2" style={{ color: `${INK}77` }}>Pas encore de réponse.</div>
        ) : (
          <div className="flex flex-col gap-2 mt-3">
            {texts.map((t, i) => (
              <div key={i} className="sondage-sans text-sm py-2 px-3" style={{ borderLeft: `2px solid ${SLATE}` }}>
                {t}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (q.type === "number") {
    const vals = responses.map((r) => r.answers?.[q.id]).filter((v) => typeof v === "number" && !Number.isNaN(v));
    const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "—";
    const min = vals.length ? Math.min(...vals) : "—";
    const max = vals.length ? Math.max(...vals) : "—";
    const uniq = Array.from(new Set(vals)).sort((a, b) => a - b);
    const data = uniq.map((v) => ({ name: `${v}${q.unit ? ` ${q.unit}` : ""}`, value: vals.filter((x) => x === v).length }));
    return (
      <div>
        <QLabel index={index} text={q.text} />
        <div className="sondage-sans text-sm mt-1" style={{ color: `${INK}99` }}>
          Moyenne : <span className="sondage-mono font-bold" style={{ color: INK }}>{avg}{q.unit ? ` ${q.unit}` : ""}</span>
          {vals.length > 0 && <span className="sondage-mono text-xs ml-2" style={{ color: SLATE }}>(min {min} · max {max})</span>}
        </div>
        {data.length > 0 && <ChartBlock data={data} />}
      </div>
    );
  }

  if (q.type === "rating") {
    const vals = responses.map((r) => r.answers?.[q.id]).filter((v) => typeof v === "number");
    const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "—";
    const data = [1, 2, 3, 4, 5].map((n) => ({ name: String(n), value: vals.filter((v) => v === n).length }));
    return (
      <div>
        <QLabel index={index} text={q.text} />
        <div className="sondage-sans text-sm mt-1" style={{ color: `${INK}99` }}>
          Moyenne : <span className="sondage-mono font-bold" style={{ color: INK }}>{avg}</span> / 5
        </div>
        <ChartBlock data={data} />
      </div>
    );
  }

  // single or multi
  const options = q.options || [];
  const data = options.map((opt) => {
    const count = responses.filter((r) => {
      const a = r.answers?.[q.id];
      if (q.type === "multi") return Array.isArray(a) && a.includes(opt);
      return a === opt;
    }).length;
    return { name: opt, value: count };
  });
  return (
    <div>
      <QLabel index={index} text={q.text} />
      <ChartBlock data={data} />
    </div>
  );
}

function QLabel({ index, text }) {
  return (
    <div className="sondage-sans font-semibold text-[15px]">
      <span className="sondage-mono text-xs mr-2" style={{ color: SLATE }}>Q{index + 1}</span>
      {text}
    </div>
  );
}

function ChartBlock({ data }) {
  const height = Math.max(120, data.length * 42);
  return (
    <div className="mt-3" style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, left: 4, bottom: 4 }}>
          <CartesianGrid horizontal={false} stroke={`${SLATE}33`} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: INK, fontFamily: "monospace" }} axisLine={{ stroke: `${SLATE}66` }} tickLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fontSize: 13, fill: INK, fontFamily: "-apple-system, sans-serif" }}
            axisLine={{ stroke: `${SLATE}66` }}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: `${SLATE}22` }}
            contentStyle={{ background: PAPER, border: `1px solid ${INK}`, borderRadius: 0, fontFamily: "-apple-system, sans-serif", fontSize: 13 }}
          />
          <Bar dataKey="value" radius={[0, 2, 2, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
            <LabelList dataKey="value" position="right" style={{ fill: INK, fontSize: 12, fontFamily: "monospace" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
