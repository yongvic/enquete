import { AppHeader } from "@/components/AppHeader";
import { AnswerSurveyForm } from "@/components/AnswerSurveyForm";
import { setRequestLocale } from "next-intl/server";

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
