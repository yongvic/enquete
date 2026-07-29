import { SurveyStatus } from "@prisma/client";
import { AppHeader } from "@/components/AppHeader";
import { SharePanel } from "@/components/SharePanel";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { buildPageMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
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
    path: `/publie/${code}`,
    title: locale === "en" ? "Share survey" : "Partager le sondage",
    noIndex: true,
  });
}

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
      <AppHeader />
      <div className="sondage-page">
        <SharePanel code={survey.code} />
      </div>
    </>
  );
}
