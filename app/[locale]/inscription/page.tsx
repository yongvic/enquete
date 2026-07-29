import { AuthShell } from "@/components/AuthShell";
import { RegisterForm } from "@/components/AuthForms";
import { buildPageMetadata } from "@/lib/seo";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    path: "/inscription",
    title: locale === "en" ? "Create an account" : "Créer un compte",
    description:
      locale === "en"
        ? "Create a free account to build surveys for theses, dissertations and field research."
        : "Créez un compte gratuit pour lancer vos sondages de mémoire, thèse ou enquête de terrain.",
  });
}

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthShell mode="register">
      <RegisterForm />
    </AuthShell>
  );
}
