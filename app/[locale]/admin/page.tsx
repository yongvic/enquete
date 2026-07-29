import { AppHeader } from "@/components/AppHeader";
import { AdminStats } from "@/components/AdminStats";
import { getPlatformStats, getRecentUsers } from "@/lib/actions/admin";
import { getRecentFeedback } from "@/lib/actions/feedback";
import { requireSuperAdmin } from "@/lib/session";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await requireSuperAdmin(locale);
  const t = await getTranslations("admin");
  const [stats, recentUsers, recentFeedback] = await Promise.all([
    getPlatformStats(locale),
    getRecentUsers(locale),
    getRecentFeedback(locale),
  ]);

  return (
    <>
      <AppHeader />
      <div className="sondage-page max-w-3xl">
        <AdminStats
          stats={stats}
          recentUsers={recentUsers}
          recentFeedback={recentFeedback}
          labels={{
            title: t("title"),
            subtitle: t("subtitle"),
            totalUsers: t("totalUsers"),
            newUsersWeek: t("newUsersWeek"),
            publishedSurveys: t("publishedSurveys"),
            draftSurveys: t("draftSurveys"),
            totalResponses: t("totalResponses"),
            responsesWeek: t("responsesWeek"),
            totalFeedback: t("totalFeedback"),
            feedbackWeek: t("feedbackWeek"),
            recentUsers: t("recentUsers"),
            recentFeedback: t("recentFeedback"),
            noFeedback: t("noFeedback"),
            message: t("message"),
            date: t("date"),
            feedbackSummary: t("feedbackSummary"),
            surveys: t("surveys"),
            privacyNote: t("privacyNote"),
            rating: t("rating"),
            page: t("page"),
          }}
        />
      </div>
    </>
  );
}
