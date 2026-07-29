import { AppHeader } from "@/components/AppHeader";
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
      <AppHeader />
      <div className="sondage-page">
        <ResultsView initialCode={code} />
      </div>
    </>
  );
}
