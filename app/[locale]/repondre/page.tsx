import { Header } from "@/components/Header";
import { AnswerSurveyForm } from "@/components/AnswerSurveyForm";
import { setRequestLocale } from "next-intl/server";

export default async function AnswerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <div className="sondage-page">
        <AnswerSurveyForm />
      </div>
    </>
  );
}
