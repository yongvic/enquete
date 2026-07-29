import { INK, SLATE } from "@/lib/constants";

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
    _count: { surveys: number };
  }[];
  recentFeedback: {
    id: string;
    message: string;
    email: string | null;
    rating: number | null;
    page: string | null;
    createdAt: Date;
  }[];
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
    surveys: string;
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

      <section className="mt-10" id="feedbacks">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-bold text-lg">{labels.recentFeedback}</h2>
          <span className="sondage-mono text-xs" style={{ color: SLATE }}>
            {stats.totalFeedback} total · {stats.feedbackWeek} (7 j)
          </span>
        </div>

        {recentFeedback.length === 0 ? (
          <p className="sondage-sans text-sm mt-4 py-6 px-4 text-center" style={{ border: `1px dashed ${SLATE}55`, color: SLATE }}>
            {labels.noFeedback}
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full sondage-sans text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${SLATE}55` }}>
                  <th className="text-left py-2 pr-4 font-semibold">{labels.message}</th>
                  <th className="text-left py-2 pr-4 font-semibold">{labels.rating}</th>
                  <th className="text-left py-2 pr-4 font-semibold">Email</th>
                  <th className="text-left py-2 pr-4 font-semibold">{labels.page}</th>
                  <th className="text-left py-2 font-semibold">{labels.date}</th>
                </tr>
              </thead>
              <tbody>
                {recentFeedback.map((f) => (
                  <tr key={f.id} style={{ borderBottom: `1px solid ${SLATE}22` }}>
                    <td className="py-3 pr-4 max-w-xs sm:max-w-md align-top whitespace-pre-wrap">{f.message}</td>
                    <td className="py-3 pr-4 align-top sondage-mono whitespace-nowrap">
                      {f.rating != null ? `${f.rating}/5` : "—"}
                    </td>
                    <td className="py-3 pr-4 align-top">{f.email || "—"}</td>
                    <td className="py-3 pr-4 align-top text-xs" style={{ color: SLATE }}>
                      {f.page || "—"}
                    </td>
                    <td className="py-3 align-top text-xs whitespace-nowrap" style={{ color: SLATE }}>
                      {new Date(f.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-bold text-lg">{labels.recentUsers}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full sondage-sans text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${SLATE}55` }}>
                <th className="text-left py-2 pr-4 font-semibold">Email</th>
                <th className="text-left py-2 pr-4 font-semibold">Nom</th>
                <th className="text-left py-2 pr-4 font-semibold">{labels.surveys}</th>
                <th className="text-left py-2 font-semibold">Rôle</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u) => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${SLATE}22` }}>
                  <td className="py-2.5 pr-4">{u.email}</td>
                  <td className="py-2.5 pr-4">{u.name || "—"}</td>
                  <td className="py-2.5 pr-4 sondage-mono">{u._count.surveys}</td>
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
