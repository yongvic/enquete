import { INK, SLATE } from "@/lib/constants";
import { FeedbackPanel, FeedbackItem } from "./FeedbackPanel";

interface AdminStatsProps {
  stats: {
    totalUsers: number;
    newUsersWeek: number;
    publishedSurveys: number;
    draftSurveys: number;
    totalResponses: number;
    responsesWeek: number;
    totalFeedback: number;
    feedbackWeek: number;
  };
  recentUsers: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    createdAt: Date;
    responseCount: number;
    _count: { surveys: number };
  }[];
  recentFeedback: FeedbackItem[];
  labels: {
    title: string;
    subtitle: string;
    totalUsers: string;
    newUsersWeek: string;
    publishedSurveys: string;
    draftSurveys: string;
    totalResponses: string;
    responsesWeek: string;
    totalFeedback: string;
    feedbackWeek: string;
    recentUsers: string;
    recentFeedback: string;
    noFeedback: string;
    message: string;
    date: string;
    feedbackSummary: string;
    surveys: string;
    responses: string;
    privacyNote: string;
    rating: string;
    page: string;
  };
}

export function AdminStats({ stats, recentUsers, recentFeedback, labels }: AdminStatsProps) {
  const cards = [
    { label: labels.totalUsers, value: stats.totalUsers },
    { label: labels.newUsersWeek, value: stats.newUsersWeek },
    { label: labels.publishedSurveys, value: stats.publishedSurveys },
    { label: labels.draftSurveys, value: stats.draftSurveys },
    { label: labels.totalResponses, value: stats.totalResponses },
    { label: labels.responsesWeek, value: stats.responsesWeek },
    { label: labels.totalFeedback, value: stats.totalFeedback },
    { label: labels.feedbackWeek, value: stats.feedbackWeek },
  ];

  return (
    <div className="pt-6 pb-10">
      <div className="sondage-mono text-xs tracking-widest uppercase" style={{ color: SLATE }}>
        Superadmin
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold mt-1">{labels.title}</h1>
      <p className="sondage-sans text-sm mt-2" style={{ color: `${INK}99` }}>
        {labels.subtitle}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-8">
        {cards.map((c) => (
          <div key={c.label} className="p-4" style={{ border: `1px solid ${SLATE}44` }}>
            <div className="sondage-mono text-2xl font-bold">{c.value}</div>
            <div className="sondage-sans text-xs mt-1" style={{ color: SLATE }}>
              {c.label}
            </div>
          </div>
        ))}
      </div>

      <FeedbackPanel
        className="mt-10"
        items={recentFeedback}
        total={stats.totalFeedback}
        weekCount={stats.feedbackWeek}
        labels={{
          title: labels.recentFeedback,
          noFeedback: labels.noFeedback,
          message: labels.message,
          rating: labels.rating,
          page: labels.page,
          date: labels.date,
          summary: labels.feedbackSummary,
        }}
      />

      <section className="mt-10">
        <h2 className="font-bold text-lg">{labels.recentUsers}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full sondage-sans text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${SLATE}55` }}>
                <th className="text-left py-2 pr-4 font-semibold">Email</th>
                <th className="text-left py-2 pr-4 font-semibold">Nom</th>
                <th className="text-left py-2 pr-4 font-semibold">{labels.surveys}</th>
                <th className="text-left py-2 pr-4 font-semibold">{labels.responses}</th>
                <th className="text-left py-2 font-semibold">Rôle</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u) => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${SLATE}22` }}>
                  <td className="py-2.5 pr-4">{u.email}</td>
                  <td className="py-2.5 pr-4">{u.name || "—"}</td>
                  <td className="py-2.5 pr-4 sondage-mono">{u._count.surveys}</td>
                  <td className="py-2.5 pr-4 sondage-mono">{u.responseCount}</td>
                  <td className="py-2.5 sondage-mono text-xs">{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="sondage-sans text-xs mt-10 py-3 px-3" style={{ background: `${SLATE}18`, color: `${INK}bb` }}>
        {labels.privacyNote}
      </p>
    </div>
  );
}
