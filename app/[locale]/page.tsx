import { HomeLanding } from "@/components/HomeLanding";
import { auth } from "@/lib/auth";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();

  if (session?.user?.id) {
    redirect(`/${locale}/dashboard`);
  }

  return <HomeLanding />;
}
