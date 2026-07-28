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

  const survey = await prisma.survey.findUnique({ where: { code: code.toUpperCase() } });
  if (!survey || survey.userId !== session.user.id) notFound();

  return (
    <>
      <Header isAdmin />
      <div className="px-5 sm:px-8 pb-10 pt-2 max-w-2xl mx-auto">
        <SharePanel code={survey.code} />
      </div>
    </>
  );
}
