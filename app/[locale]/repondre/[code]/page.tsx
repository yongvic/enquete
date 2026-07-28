import { Header } from "@/components/Header";
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
      <Header />
      <div className="sondage-page">
        <AnswerSurveyForm initialCode={code} />
      </div>
    </>
  );
}
