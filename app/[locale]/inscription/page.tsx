import { Header } from "@/components/Header";
import { RegisterForm } from "@/components/AuthForms";
import { setRequestLocale } from "next-intl/server";

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <div className="sondage-page">
        <RegisterForm />
      </div>
    </>
  );
}
