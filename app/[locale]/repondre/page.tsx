import { AppHeader } from "@/components/AppHeader";
import { AnswerSurveyForm } from "@/components/AnswerSurveyForm";
import { buildPageMetadata } from "@/lib/seo";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    path: "/repondre",
    title: locale === "en" ? "Answer a survey" : "Répondre à un sondage",
    description:
      locale === "en"
        ? "Enter a survey code to answer. No account required."
        : "Entrez un code pour répondre à un sondage. Aucun compte requis.",
  });
}

export default async function AnswerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <AppHeader />
      <div className="sondage-page">
        <AnswerSurveyForm />
      </div>
    </>
  );
}
