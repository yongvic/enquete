import { AppHeader } from "@/components/AppHeader";
import { AnswerSurveyForm } from "@/components/AnswerSurveyForm";
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
    path: `/repondre/${code}`,
    title: locale === "en" ? `Survey ${code.toUpperCase()}` : `Sondage ${code.toUpperCase()}`,
    description:
      locale === "en"
        ? `Answer survey ${code.toUpperCase()}. No account required.`
        : `Répondez au sondage ${code.toUpperCase()}. Aucun compte requis.`,
  });
}

export default async function AnswerByCodePage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  setRequestLocale(locale);

  return (
    <>
      <AppHeader />
      <div className="sondage-page">
        <AnswerSurveyForm initialCode={code} />
      </div>
    </>
  );
}
