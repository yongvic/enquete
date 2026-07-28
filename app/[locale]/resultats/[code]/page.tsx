import { Header } from "@/components/Header";
import { ResultsView } from "@/components/ResultsView";
import { requireAuth } from "@/lib/session";
import { setRequestLocale } from "next-intl/server";

export default async function ResultsByCodePage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const session = await requireAuth(locale);

  return (
    <>
      <Header isLoggedIn role={session.user.role} />
      <div className="px-5 sm:px-8 pb-10 pt-2 max-w-2xl mx-auto">
        <ResultsView initialCode={code} />
      </div>
    </>
  );
}
