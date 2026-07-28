import { Header } from "@/components/Header";
import { LoginForm } from "@/components/AuthForms";
import { setRequestLocale } from "next-intl/server";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <div className="px-5 sm:px-8 pb-10 pt-2 max-w-2xl mx-auto">
        <LoginForm />
      </div>
    </>
  );
}
