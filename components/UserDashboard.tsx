"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Plus, BarChart3, Share2, Trash2, Pencil, FileEdit, Shield } from "lucide-react";
import { deleteSurvey } from "@/lib/actions/survey";
import { INK, OCHRE, SLATE, RUST } from "@/lib/constants";
import { SurveyStatus } from "@prisma/client";
import { useState } from "react";
import { FeedbackPanel, FeedbackItem } from "./FeedbackPanel";

interface SurveyRow {
  id: string;
  code: string | null;
  title: string;
  status: SurveyStatus;
  createdAt: Date;
  publishedAt: Date | null;
  _count: { responses: number };
}

interface UserDashboardProps {
  published: SurveyRow[];
  drafts: SurveyRow[];
  userName?: string | null;
  feedback?: {
    items: FeedbackItem[];
    total: number;
    weekCount: number;
    labels: {
      title: string;
      noFeedback: string;
      message: string;
      rating: string;
      page: string;
      date: string;
      summary: string;
    };
  };
}

export function UserDashboard({ published, drafts, userName, feedback }: UserDashboardProps) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    setDeleting(id);
    await deleteSurvey(id);
    setDeleting(null);
    router.refresh();
  };

  return (
    <div className="pt-6 pb-10">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="sondage-mono text-xs tracking-widest uppercase" style={{ color: SLATE }}>
            {t("label")}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">
            {userName ? t("greeting", { name: userName }) : t("title")}
          </h1>
          <p className="sondage-sans text-sm mt-2" style={{ color: `${INK}99` }}>
            {t("subtitle")}
          </p>
        </div>
        <Link
          href="/creer"
          className="sondage-btn sondage-sans flex items-center gap-2 py-2.5 px-4 text-sm text-white"
          style={{ background: INK }}
        >
          <Plus size={16} /> {t("newSurvey")}
        </Link>
      </div>

      {feedback && (
        <div className="mt-8 p-4 sm:p-5" style={{ border: `1px solid ${OCHRE}55`, background: `${OCHRE}08` }}>
          <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
            <p className="sondage-sans text-xs" style={{ color: `${INK}99` }}>
              {t("feedbackHint")}
            </p>
            <Link
              href="/admin"
              className="sondage-btn sondage-sans text-xs font-semibold flex items-center gap-1.5 px-2.5 py-1.5"
              style={{ color: OCHRE, border: `1px solid ${OCHRE}66` }}
            >
              <Shield size={13} />
              {t("viewFullAdmin")}
            </Link>
          </div>
          <FeedbackPanel
            items={feedback.items}
            total={feedback.total}
            weekCount={feedback.weekCount}
            labels={feedback.labels}
          />
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mt-8">
        <StatCard label={t("stats.published")} value={published.length} />
        <StatCard label={t("stats.drafts")} value={drafts.length} />
        <StatCard
          label={t("stats.responses")}
          value={published.reduce((s, x) => s + x._count.responses, 0)}
        />
      </div>

      <section className="mt-10">
        <h2 className="font-bold text-lg">{t("publishedTitle")}</h2>
        {published.length === 0 ? (
          <p className="sondage-sans text-sm mt-3" style={{ color: `${INK}88` }}>
            {t("noPublished")}
          </p>
        ) : (
          <div className="flex flex-col gap-2 mt-4">
            {published.map((s) => (
              <SurveyCard
                key={s.id}
                survey={s}
                deleting={deleting === s.id}
                onDelete={() => handleDelete(s.id)}
              />
            ))}
          </div>
        )}
      </section>

      {drafts.length > 0 && (
        <section className="mt-10">
          <h2 className="font-bold text-lg">{t("draftsTitle")}</h2>
          <div className="flex flex-col gap-2 mt-4">
            {drafts.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 py-3 px-3"
                style={{ border: `1px solid ${SLATE}55` }}
              >
                <div className="min-w-0">
                  <div className="sondage-sans text-sm font-semibold truncate">{s.title || t("untitled")}</div>
                  <div className="sondage-mono text-xs mt-0.5" style={{ color: SLATE }}>
                    {t("draft")}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link
                    href={`/creer?draft=${s.id}`}
                    className="sondage-btn p-2"
                    style={{ border: `1px solid ${INK}` }}
                    title={t("edit")}
                  >
                    <Pencil size={14} />
                  </Link>
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={deleting === s.id}
                    className="sondage-btn p-2"
                    style={{ color: RUST }}
                    title={t("delete")}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="sondage-sans text-xs mt-10 py-3 px-3" style={{ background: `${OCHRE}15`, color: `${INK}bb` }}>
        {t("securityNote")}
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-4 text-center" style={{ border: `1px solid ${SLATE}44` }}>
      <div className="sondage-mono text-2xl font-bold">{value}</div>
      <div className="sondage-sans text-xs mt-1" style={{ color: SLATE }}>
        {label}
      </div>
    </div>
  );
}

function SurveyCard({
  survey,
  deleting,
  onDelete,
}: {
  survey: SurveyRow;
  deleting: boolean;
  onDelete: () => void;
}) {
  const t = useTranslations("dashboard");

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-3"
      style={{ border: `1px solid ${SLATE}55` }}
    >
      <div className="min-w-0">
        <div className="sondage-sans text-sm font-semibold truncate">{survey.title}</div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="sondage-mono text-xs tracking-widest" style={{ color: OCHRE }}>
            {survey.code}
          </span>
          <span className="sondage-sans text-xs" style={{ color: SLATE }}>
            {t("responseCount", { count: survey._count.responses })}
          </span>
        </div>
      </div>
      <div className="flex gap-2 shrink-0 flex-wrap">
        <Link
          href={`/creer?edit=${survey.id}`}
          className="sondage-btn sondage-sans text-xs px-3 py-2 flex items-center gap-1.5"
          style={{ border: `1px solid ${SLATE}88` }}
          title={t("edit")}
        >
          <FileEdit size={13} /> {t("edit")}
        </Link>
        <Link
          href={`/publie/${survey.code}`}
          className="sondage-btn sondage-sans text-xs px-3 py-2 flex items-center gap-1.5"
          style={{ border: `1px solid ${INK}` }}
        >
          <Share2 size={13} /> {t("share")}
        </Link>
        <Link
          href={`/resultats/${survey.code}`}
          className="sondage-btn sondage-sans text-xs px-3 py-2 flex items-center gap-1.5 text-white"
          style={{ background: INK }}
        >
          <BarChart3 size={13} /> {t("results")}
        </Link>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="sondage-btn p-2"
          style={{ color: RUST }}
          title={t("delete")}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
