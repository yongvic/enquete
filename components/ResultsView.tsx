"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Loader2, AlertCircle, BarChart3, List, PieChart } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getSurveyResults } from "@/lib/actions/survey";
import { INK, RUST, SLATE, Question, SurveyData, SurveyResponse } from "@/lib/constants";
import { computeQuestionStats } from "@/lib/stats";
import { ResultsChart, type ChartVariant } from "./ResultsChart";
import { ResultsOverview } from "./ResultsOverview";
import { AiReportPanel } from "./AiReportPanel";

type ViewMode = "simple" | "bar" | "pie";

interface ResultsViewProps {
  initialCode: string;
}

export function ResultsView({ initialCode }: ResultsViewProps) {
  const t = useTranslations("results");
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("bar");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      const result = await getSurveyResults(initialCode);
      setLoading(false);
      if (result.error === "unauthorized" || result.error === "forbidden") {
        setError(t("errors.unauthorized"));
        return;
      }
      if (result.error === "notFound") {
        setError(t("errors.notFound"));
        return;
      }
      if (!result.survey) return;
      setSurvey(result.survey);
      setResponses(result.responses);
    })();
  }, [initialCode, t]);

  if (loading) {
    return (
      <div className="pt-16 flex justify-center">
        <Loader2 size={24} className="animate-spin" style={{ color: SLATE }} />
      </div>
    );
  }

  if (error || !survey || !responses) {
    return (
      <div className="pt-10 text-center">
        <AlertCircle size={24} style={{ color: RUST }} className="mx-auto" />
        <p className="sondage-sans text-sm mt-4" style={{ color: RUST }}>
          {error || t("errors.notFound")}
        </p>
        <Link href="/dashboard" className="sondage-btn sondage-sans inline-block mt-6 py-2.5 px-6 text-sm text-white" style={{ background: INK }}>
          {t("backDashboard")}
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="sondage-mono text-xs tracking-widest uppercase mb-2" style={{ color: SLATE }}>
            {survey.code}
          </div>
          <h1 className="text-2xl font-bold">{survey.title}</h1>
          <p className="sondage-sans text-sm mt-1" style={{ color: `${INK}99` }}>
            {responses.length === 1
              ? t("responses", { count: responses.length })
              : t("responses_plural", { count: responses.length })}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a
            href={`/api/export/csv/${survey.code}`}
            className="sondage-btn sondage-sans text-xs px-3 py-2 flex-1 sm:flex-none text-center"
            style={{ border: `1px solid ${INK}` }}
            title={t("exportCsvHint")}
          >
            {t("exportCsv")}
          </a>
          <a
            href={`/api/export/xlsx/${survey.code}`}
            className="sondage-btn sondage-sans text-xs px-3 py-2 flex-1 sm:flex-none text-center"
            style={{ border: `1px solid ${INK}` }}
            title={t("exportXlsxHint")}
          >
            {t("exportXlsx")}
          </a>
          <a
            href={`/api/export/pdf/${survey.code}`}
            className="sondage-btn sondage-sans text-xs px-3 py-2 flex-1 sm:flex-none text-center text-white"
            style={{ background: INK }}
            title={t("exportPdfHint")}
          >
            {t("exportPdf")}
          </a>
        </div>
      </div>

      {responses.length > 0 && (
        <div className="flex gap-2 mt-6 flex-wrap">
          {(
            [
              { mode: "simple" as const, icon: List, label: t("viewSimple") },
              { mode: "bar" as const, icon: BarChart3, label: t("viewBar") },
              { mode: "pie" as const, icon: PieChart, label: t("viewPie") },
            ] as const
          ).map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className="sondage-btn sondage-sans text-xs px-3 py-2 sm:py-1.5 flex-1 sm:flex-none flex items-center justify-center gap-1.5 min-h-10 sm:min-h-0"
              style={{
                border: `1px solid ${viewMode === mode ? INK : SLATE + "66"}`,
                background: viewMode === mode ? INK : "transparent",
                color: viewMode === mode ? "#F7F5EF" : INK,
              }}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      )}

      {responses.length === 0 ? (
        <div className="mt-10 text-center sondage-sans text-sm" style={{ color: `${INK}88` }}>
          {t("noResponses", { code: survey.code })}
        </div>
      ) : (
        <>
          <ResultsOverview
            questions={survey.questions}
            responses={responses}
            chartVariant={viewMode === "pie" ? "pie" : "bar"}
          />
          <AiReportPanel surveyCode={survey.code} responseCount={responses.length} />
          <div className="mt-10" style={{ borderTop: `1px solid ${SLATE}44`, paddingTop: 24 }}>
            <h2 className="text-lg font-bold mb-6">{t("byQuestionTitle")}</h2>
            <div className="flex flex-col gap-9">
          {survey.questions.map((q, i) => (
            <QuestionResult key={q.id} q={q} index={i} responses={responses} viewMode={viewMode} />
          ))}
            </div>
          </div>
        </>
      )}

      <Link
        href="/dashboard"
        className="sondage-btn sondage-sans mt-10 text-sm flex items-center gap-1.5 inline-flex"
        style={{ color: SLATE }}
      >
        <ArrowLeft size={14} /> {t("backDashboard")}
      </Link>
    </div>
  );
}

function QuestionResult({
  q,
  index,
  responses,
  viewMode,
}: {
  q: Question;
  index: number;
  responses: SurveyResponse[];
  viewMode: ViewMode;
}) {
  const t = useTranslations("results");
  const stats = computeQuestionStats(q, responses);

  if (stats.type === "section") {
    return (
      <div className="pt-2">
        <div className="sondage-mono text-xs tracking-widest uppercase mb-1" style={{ color: SLATE }}>
          {t("sectionLabel")}
        </div>
        <h3 className="font-bold text-base">{q.text}</h3>
      </div>
    );
  }

  return (
    <div>
      <div className="sondage-sans font-semibold text-[15px]">
        <span className="sondage-mono text-xs mr-2" style={{ color: SLATE }}>
          Q{index + 1}
        </span>
        {q.text}
      </div>

      {stats.type === "text" && (
        <>
          {stats.texts.length === 0 ? (
            <div className="sondage-sans text-sm mt-2" style={{ color: `${INK}77` }}>
              {t("noTextAnswers")}
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-3">
              {stats.texts.map((text, i) => (
                <div key={i} className="sondage-sans text-sm py-2 px-3" style={{ borderLeft: `2px solid ${SLATE}` }}>
                  {text}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {(stats.type === "number" || stats.type === "rating") && (
        <>
          <div className="sondage-sans text-sm mt-1" style={{ color: `${INK}99` }}>
            {t("average")}:{" "}
            <span className="sondage-mono font-bold" style={{ color: INK }}>
              {stats.avg !== null ? stats.avg.toFixed(1) : "—"}
              {stats.type === "rating" ? " / 5" : q.unit ? ` ${q.unit}` : ""}
            </span>
            {stats.type === "number" && stats.min !== null && stats.max !== null && (
              <span className="sondage-mono text-xs ml-2" style={{ color: SLATE }}>
                ({t("minMax", { min: stats.min, max: stats.max })})
              </span>
            )}
          </div>
          {viewMode === "simple" ? (
            <SimpleTable data={stats.data} />
          ) : (
            <ResultsChart data={stats.data} variant={viewMode as ChartVariant} />
          )}
        </>
      )}

      {(stats.type === "single" || stats.type === "multi") &&
        (viewMode === "simple" ? (
          <SimpleTable data={stats.data} />
        ) : (
          <ResultsChart data={stats.data} variant={viewMode as ChartVariant} />
        ))}
    </div>
  );
}

function SimpleTable({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div className="mt-3 flex flex-col gap-2">
      {data.map((row) => (
        <div key={row.name} className="sondage-sans text-sm">
          <div className="flex justify-between gap-3 mb-1">
            <span className="min-w-0 break-words">{row.name}</span>
            <span className="sondage-mono shrink-0">
              {row.value} ({Math.round((row.value / total) * 100)}%)
            </span>
          </div>
          <div className="h-1.5 w-full" style={{ background: `${SLATE}33` }}>
            <div className="h-full" style={{ width: `${(row.value / total) * 100}%`, background: INK }} />
          </div>
        </div>
      ))}
    </div>
  );
}
