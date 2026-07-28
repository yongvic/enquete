import { Header } from "@/components/Header";
import { LoginForm } from "@/components/AuthForms";
import { setRequestLocale } from "next-intl/server";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <div className="sondage-page">
        <LoginForm />
      </div>
    </>
  );
}
