import { SurveyStatus } from "@prisma/client";
import { Header } from "@/components/Header";
import { SharePanel } from "@/components/SharePanel";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

export default async function PublishedPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const session = await requireAuth(locale);

  const survey = await prisma.survey.findFirst({
    where: {
      code: code.toUpperCase(),
      status: SurveyStatus.PUBLISHED,
      userId: session.user.id,
    },
  });
  if (!survey?.code) notFound();

  return (
    <>
      <Header isLoggedIn role={session.user.role} />
      <div className="sondage-page">
        <SharePanel code={survey.code} />
      </div>
    </>
  );
}
