import { HomeLanding } from "@/components/HomeLanding";
import { auth } from "@/lib/auth";
import { buildPageMetadata } from "@/lib/seo";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    path: "",
    title: locale === "en" ? "Create surveys easily" : "Créez vos sondages facilement",
  });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();

  if (session?.user?.id) {
    redirect(`/${locale}/dashboard`);
  }

  return <HomeLanding />;
}
