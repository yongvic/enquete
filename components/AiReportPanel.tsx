"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Sparkles, Loader2, AlertCircle, Download, Copy, Check } from "lucide-react";
import { INK, OCHRE, RUST, SLATE } from "@/lib/constants";

interface AiReportPanelProps {
  surveyCode: string;
  responseCount: number;
}

export function AiReportPanel({ surveyCode, responseCount }: AiReportPanelProps) {
  const t = useTranslations("results.aiReport");
  const locale = useLocale();
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/report/ai/${surveyCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(t(`errors.${data.error as string}`) || t("errors.generationFailed"));
        return;
      }
      setReport(data.report);
    } catch {
      setError(t("errors.generationFailed"));
    } finally {
      setLoading(false);
    }
  };

  const copyReport = async () => {
    if (!report) return;
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPdf = async () => {
    if (!report) return;
    const res = await fetch(`/api/report/ai/${surveyCode}/pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-ia-${surveyCode}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (responseCount === 0) return null;

  return (
    <section className="mt-8 p-5" style={{ border: `1px solid ${OCHRE}55`, background: `${OCHRE}08` }}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={18} style={{ color: OCHRE }} />
            <h2 className="font-bold text-lg">{t("title")}</h2>
          </div>
          <p className="sondage-sans text-sm mt-2" style={{ color: `${INK}99` }}>
            {t("subtitle")}
          </p>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="sondage-btn sondage-sans text-xs px-4 py-2.5 flex items-center gap-2 text-white shrink-0"
          style={{ background: INK, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {loading ? t("generating") : report ? t("regenerate") : t("generate")}
        </button>
      </div>

      {error && (
        <div className="sondage-sans text-sm mt-4 flex items-center gap-2" style={{ color: RUST }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {report && (
        <div className="mt-5">
          <div className="flex gap-2 flex-wrap mb-3">
            <button
              onClick={copyReport}
              className="sondage-btn sondage-sans text-xs px-3 py-1.5 flex items-center gap-1.5"
              style={{ border: `1px solid ${SLATE}88` }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? t("copied") : t("copy")}
            </button>
            <button
              onClick={downloadPdf}
              className="sondage-btn sondage-sans text-xs px-3 py-1.5 flex items-center gap-1.5"
              style={{ border: `1px solid ${INK}` }}
            >
              <Download size={13} /> {t("downloadPdf")}
            </button>
          </div>
          <div
            className="sondage-sans text-sm leading-relaxed p-4 whitespace-pre-wrap"
            style={{ border: `1px solid ${SLATE}44`, background: "#F7F5EF" }}
          >
            <AiReportContent report={report} />
          </div>
          <p className="sondage-sans text-[11px] mt-3" style={{ color: SLATE }}>
            {t("disclaimer")}
          </p>
        </div>
      )}
    </section>
  );
}

function AiReportContent({ report }: { report: string }) {
  const parts = report.split(/(?=^## )/m);
  return (
    <div className="flex flex-col gap-4">
      {parts.map((part, i) => {
        const trimmed = part.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith("## ")) {
          const [heading, ...rest] = trimmed.split("\n");
          return (
            <div key={i}>
              <h3 className="font-bold text-[15px] mb-2">{heading.replace(/^##\s*/, "")}</h3>
              <div style={{ color: `${INK}dd` }}>{rest.join("\n").trim()}</div>
            </div>
          );
        }
        return (
          <div key={i} style={{ color: `${INK}dd` }}>
            {trimmed}
          </div>
        );
      })}
    </div>
  );
}
