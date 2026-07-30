"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Sparkles, Loader2, AlertCircle, Download, Copy, Check } from "lucide-react";
import { INK, OCHRE, RUST, SLATE } from "@/lib/constants";

interface SavedReport {
  id: string;
  content: string;
  locale: string;
  createdAt: string;
}

interface QuotaInfo {
  unlimited: boolean;
  limit: number | null;
  usedToday: number;
  remaining: number | null;
}

interface AiReportPanelProps {
  surveyCode: string;
  responseCount: number;
}

export function AiReportPanel({ surveyCode, responseCount }: AiReportPanelProps) {
  const t = useTranslations("results.aiReport");
  const locale = useLocale();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBootLoading(true);
      try {
        const res = await fetch(`/api/report/ai/${surveyCode}`);
        const data = await res.json();
        if (cancelled || !res.ok) return;
        setReports(data.reports || []);
        setQuota(data.quota || null);
        if (data.reports?.length) {
          setActiveId(data.reports[0].id);
          setReport(data.reports[0].content);
        }
      } catch {
        // ignore bootstrap errors
      } finally {
        if (!cancelled) setBootLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [surveyCode]);

  const canGenerate = quota?.unlimited || (quota?.remaining ?? 1) > 0;

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
        if (data.error === "dailyLimit" && quota && !quota.unlimited) {
          setQuota({ ...quota, remaining: 0, usedToday: quota.limit ?? quota.usedToday });
        }
        return;
      }
      setReport(data.report);
      setActiveId(data.reportId);
      setReports(data.reports || []);
      setQuota(data.quota || null);
    } catch {
      setError(t("errors.generationFailed"));
    } finally {
      setLoading(false);
    }
  };

  const selectReport = (id: string) => {
    const found = reports.find((r) => r.id === id);
    if (!found) return;
    setActiveId(id);
    setReport(found.content);
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
          {quota && (
            <p className="sondage-sans text-xs mt-2" style={{ color: SLATE }}>
              {quota.unlimited
                ? t("quotaUnlimited")
                : t("quotaRemaining", { remaining: quota.remaining ?? 0, limit: quota.limit ?? 2 })}
            </p>
          )}
          <p className="sondage-sans text-[11px] mt-1" style={{ color: SLATE }}>
            {t("storageHint")}
          </p>
        </div>
        <button
          onClick={generate}
          disabled={loading || bootLoading || !canGenerate}
          className="sondage-btn sondage-sans text-xs px-4 py-2.5 flex items-center gap-2 text-white shrink-0"
          style={{ background: INK, opacity: loading || !canGenerate ? 0.65 : 1 }}
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

      {bootLoading && (
        <div className="mt-4 flex items-center gap-2 sondage-sans text-sm" style={{ color: SLATE }}>
          <Loader2 size={14} className="animate-spin" /> {t("loadingSaved")}
        </div>
      )}

      {reports.length > 1 && (
        <div className="mt-4">
          <label className="sondage-sans text-xs font-medium" style={{ color: SLATE }}>
            {t("history")}
          </label>
          <select
            className="auth-input mt-1.5 sondage-sans text-sm"
            value={activeId || ""}
            onChange={(e) => selectReport(e.target.value)}
          >
            {reports.map((r) => (
              <option key={r.id} value={r.id}>
                {new Date(r.createdAt).toLocaleString(locale)}
              </option>
            ))}
          </select>
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
            className="ai-report-body sondage-sans text-sm leading-relaxed p-4 sm:p-5 pb-8 sm:pb-6"
            style={{ border: `1px solid ${SLATE}44`, background: "#fff", overflow: "visible" }}
          >
            <AiReportContent report={report} />
          </div>
          <p className="sondage-sans text-[11px] mt-3 mb-2" style={{ color: SLATE }}>
            {t("disclaimer")}
          </p>
        </div>
      )}
    </section>
  );
}

function AiReportContent({ report }: { report: string }) {
  const normalized = report.replace(/\r\n/g, "\n").trim();
  // Split before any ATX heading (# / ## / ###) so no section is swallowed.
  const blocks = normalized
    .split(/\n(?=#{1,3}\s)/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return (
      <pre className="sondage-sans text-sm whitespace-pre-wrap break-words m-0" style={{ color: `${INK}ee` }}>
        {report}
      </pre>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {blocks.map((block, i) => {
        const headingMatch = block.match(/^(#{1,3})\s+(.+?)(?:\n|$)([\s\S]*)$/);
        if (headingMatch) {
          const heading = headingMatch[2].trim();
          const body = (headingMatch[3] || "").trim();
          return (
            <section key={i}>
              <h3 className="font-bold text-[15px] mb-2.5 tracking-tight" style={{ color: INK }}>
                {heading}
              </h3>
              {body ? <MarkdownBody text={body} /> : null}
            </section>
          );
        }
        return <MarkdownBody key={i} text={block} />;
      })}
    </div>
  );
}

function MarkdownBody({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements: ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (!listItems.length) return;
    elements.push(
      <ul key={`ul-${elements.length}`} className="flex flex-col gap-1.5 my-1 pl-0 list-none">
        {listItems.map((item, idx) => (
          <li key={idx} className="flex gap-2.5 items-start">
            <span className="mt-[0.45em] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: OCHRE }} />
            <span className="min-w-0 break-words" style={{ color: `${INK}ee` }}>
              {formatInline(item)}
            </span>
          </li>
        ))}
      </ul>
    );
    listItems = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = line.match(/^[-*•]\s+(.+)$/) || line.match(/^\d+\.\s+(.+)$/);
    if (bullet) {
      listItems.push(bullet[1]);
      continue;
    }
    flushList();
    if (!line.trim()) {
      elements.push(<div key={`sp-${elements.length}`} className="h-2" />);
      continue;
    }
    elements.push(
      <p key={`p-${elements.length}`} className="mb-1.5 last:mb-0 break-words" style={{ color: `${INK}ee` }}>
        {formatInline(line.trim())}
      </p>
    );
  }
  flushList();

  return <div className="flex flex-col gap-0.5">{elements}</div>;
}

function formatInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={i} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="sondage-mono text-[12px] px-1 py-0.5 rounded-sm"
          style={{ background: `${SLATE}22` }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
