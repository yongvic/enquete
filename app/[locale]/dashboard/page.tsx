import { AppHeader } from "@/components/AppHeader";
import { UserDashboard } from "@/components/UserDashboard";
import { getFeedbackOverview } from "@/lib/actions/feedback";
import { getMySurveys } from "@/lib/actions/survey";
import { isSuperAdmin } from "@/lib/roles";
import { requireAuth } from "@/lib/session";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await requireAuth(locale);
  const { published, drafts } = await getMySurveys();

  const superadmin = isSuperAdmin(session.user.role);
  const feedback = superadmin ? await getFeedbackOverview(locale) : null;
  const tAdmin = superadmin ? await getTranslations("admin") : null;

  return (
    <>
      <AppHeader />
      <div className="sondage-page max-w-3xl">
        <UserDashboard
          published={published}
          drafts={drafts}
          userName={session.user.name}
          feedback={
            feedback && tAdmin
              ? {
                  items: feedback.recent,
                  total: feedback.total,
                  weekCount: feedback.weekCount,
                  labels: {
                    title: tAdmin("recentFeedback"),
                    noFeedback: tAdmin("noFeedback"),
                    message: tAdmin("message"),
                    rating: tAdmin("rating"),
                    page: tAdmin("page"),
                    date: tAdmin("date"),
                    summary: tAdmin("feedbackSummary"),
                  },
                }
              : undefined
          }
        />
      </div>
    </>
  );
}
