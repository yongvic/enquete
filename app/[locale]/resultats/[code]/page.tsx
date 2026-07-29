import { AppHeader } from "@/components/AppHeader";
import { ResultsView } from "@/components/ResultsView";
import { requireAuth } from "@/lib/session";
import { buildPageMetadata } from "@/lib/seo";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}): Promise<Metadata> {
  const { locale, code } = await params;
  return buildPageMetadata({
    locale,
    path: `/resultats/${code}`,
    title: locale === "en" ? "Results" : "Résultats",
    noIndex: true,
  });
}

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
