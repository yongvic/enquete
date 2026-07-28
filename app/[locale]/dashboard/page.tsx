import { Header } from "@/components/Header";
import { UserDashboard } from "@/components/UserDashboard";
import { getMySurveys } from "@/lib/actions/survey";
import { requireAuth } from "@/lib/session";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await requireAuth(locale);
  const { published, drafts } = await getMySurveys();

  return (
    <>
      <Header isLoggedIn role={session.user.role} />
      <div className="px-5 sm:px-8 pb-10 pt-2 max-w-3xl mx-auto">
        <UserDashboard
          published={published}
          drafts={drafts}
          userName={session.user.name}
        />
      </div>
    </>
  );
}
