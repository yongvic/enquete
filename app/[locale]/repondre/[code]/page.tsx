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
      <div className="px-5 sm:px-8 pb-10 pt-2 max-w-2xl mx-auto">
        <AnswerSurveyForm initialCode={code} />
      </div>
    </>
  );
}
