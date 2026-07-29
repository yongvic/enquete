import { INK, SLATE } from "@/lib/constants";

export interface FeedbackItem {
  id: string;
  message: string;
  email: string | null;
  rating: number | null;
  page: string | null;
  createdAt: Date;
}

interface FeedbackPanelProps {
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
  className?: string;
}

export function FeedbackPanel({ items, total, weekCount, labels, className = "" }: FeedbackPanelProps) {
  return (
    <section className={className} id="feedbacks">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-bold text-lg">{labels.title}</h2>
        <span className="sondage-mono text-xs" style={{ color: SLATE }}>
          {labels.summary.replace("{total}", String(total)).replace("{week}", String(weekCount))}
        </span>
      </div>

      {items.length === 0 ? (
        <p
          className="sondage-sans text-sm mt-4 py-6 px-4 text-center"
          style={{ border: `1px dashed ${SLATE}55`, color: SLATE }}
        >
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
              {items.map((f) => (
                <tr key={f.id} style={{ borderBottom: `1px solid ${SLATE}22` }}>
                  <td className="py-3 pr-4 max-w-xs sm:max-w-md align-top whitespace-pre-wrap" style={{ color: INK }}>
                    {f.message}
                  </td>
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
  );
}
