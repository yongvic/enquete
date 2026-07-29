import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/AuthForms";
import { setRequestLocale } from "next-intl/server";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthShell mode="login">
      <LoginForm />
    </AuthShell>
  );
}
