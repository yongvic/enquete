import { Header } from "@/components/Header";
import { ResultsView } from "@/components/ResultsView";
import { getMySurveys } from "@/lib/actions/survey";
import { requireAuth } from "@/lib/session";
import { setRequestLocale } from "next-intl/server";

export default async function ResultsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAuth(locale);
  const mySurveys = await getMySurveys();

  return (
    <>
      <Header isAdmin />
      <div className="px-5 sm:px-8 pb-10 pt-2 max-w-2xl mx-auto">
        <ResultsView mySurveys={mySurveys} />
      </div>
    </>
  );
}
