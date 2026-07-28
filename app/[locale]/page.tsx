import { Header } from "@/components/Header";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { ClipboardList, Plus, LayoutDashboard } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { INK, OCHRE, SLATE } from "@/lib/constants";
import { redirect } from "next/navigation";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const session = await auth();

  if (session?.user?.id) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <>
      <Header />
      <div className="px-5 sm:px-8 pb-10 pt-2 max-w-2xl mx-auto">
        <div className="pt-6">
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight whitespace-pre-line" style={{ letterSpacing: "-0.01em" }}>
            {t("title")}
          </h1>
          <p className="sondage-sans text-[15px] mt-3 leading-relaxed" style={{ color: "#1E2A38bb" }}>
            {t("subtitle")}
          </p>

          <div className="grid sm:grid-cols-2 gap-3 mt-8">
            <HomeLinkCard
              href="/inscription"
              icon={<Plus size={20} />}
              title={t("create")}
              desc={t("createDesc")}
            />
            <HomeLinkCard
              href="/repondre"
              icon={<ClipboardList size={20} />}
              title={t("answer")}
              desc={t("answerDesc")}
            />
            <HomeLinkCard
              href="/connexion"
              icon={<LayoutDashboard size={20} />}
              title={t("login")}
              desc={t("loginDesc")}
              full
            />
          </div>

          <p className="sondage-mono text-[11px] tracking-widest uppercase mt-10 text-center" style={{ color: SLATE }}>
            {t("noAccountRespondent")}
          </p>
        </div>
      </div>
    </>
  );
}

function HomeLinkCard({
  href,
  icon,
  title,
  desc,
  full,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  full?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`sondage-btn block text-left p-5 ${full ? "sm:col-span-2" : ""}`}
      style={{ border: `1px solid ${INK}`, background: "transparent" }}
    >
      <div style={{ color: OCHRE }}>{icon}</div>
      <div className="mt-3 font-bold text-[17px]">{title}</div>
      <div className="sondage-sans text-[13px] mt-1" style={{ color: `${INK}99` }}>
        {desc}
      </div>
    </Link>
  );
}
