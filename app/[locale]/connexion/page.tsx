import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/AuthForms";
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
    path: "/connexion",
    title: locale === "en" ? "Sign in" : "Connexion",
    description:
      locale === "en"
        ? "Sign in to create surveys, share links and view your results."
        : "Connectez-vous pour créer des sondages, partager vos liens et consulter vos résultats.",
  });
}

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthShell mode="login">
      <LoginForm />
    </AuthShell>
  );
}
