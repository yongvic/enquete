import { Header } from "@/components/Header";
import { CreateSurveyForm } from "@/components/CreateSurveyForm";
import { requireAuth } from "@/lib/session";
import { setRequestLocale } from "next-intl/server";

export default async function CreatePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ blank?: string }>;
}) {
  const { locale } = await params;
  const { blank } = await searchParams;
  setRequestLocale(locale);
  await requireAuth(locale);

  return (
    <>
      <Header isAdmin />
      <div className="px-5 sm:px-8 pb-10 pt-2 max-w-2xl mx-auto">
        <CreateSurveyForm useTemplate={blank !== "1"} />
      </div>
    </>
  );
}
