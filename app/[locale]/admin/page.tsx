import { Header } from "@/components/Header";
import { AdminStats } from "@/components/AdminStats";
import { getPlatformStats, getRecentUsers } from "@/lib/actions/admin";
import { requireSuperAdmin } from "@/lib/session";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await requireSuperAdmin(locale);
  const t = await getTranslations("admin");
  const [stats, recentUsers] = await Promise.all([
    getPlatformStats(locale),
    getRecentUsers(locale),
  ]);

  return (
    <>
      <Header isLoggedIn role={session.user.role} />
      <div className="sondage-page max-w-3xl">
        <AdminStats
          stats={stats}
          recentUsers={recentUsers}
          labels={{
            title: t("title"),
            subtitle: t("subtitle"),
            totalUsers: t("totalUsers"),
            newUsersWeek: t("newUsersWeek"),
            publishedSurveys: t("publishedSurveys"),
            draftSurveys: t("draftSurveys"),
            totalResponses: t("totalResponses"),
            responsesWeek: t("responsesWeek"),
            recentUsers: t("recentUsers"),
            surveys: t("surveys"),
            privacyNote: t("privacyNote"),
          }}
        />
      </div>
    </>
  );
}
