import { Header } from "@/components/Header";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { getMySurveys } from "@/lib/actions/survey";
import { Plus, ClipboardList, BarChart3 } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { OCHRE, SLATE, INK } from "@/lib/constants";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const session = await auth();
  const mySurveys = session?.user?.id ? await getMySurveys() : [];

  return (
    <>
      <Header isAdmin={!!session?.user?.id} />
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
              href={session?.user?.id ? "/creer" : "/connexion"}
              icon={<Plus size={20} />}
              title={t("create")}
              desc={t("createDesc")}
            />
            <HomeLinkCard href="/repondre" icon={<ClipboardList size={20} />} title={t("answer")} desc={t("answerDesc")} />
            <HomeLinkCard
              href={session?.user?.id ? "/resultats" : "/connexion"}
              icon={<BarChart3 size={20} />}
              title={t("results")}
              desc={t("resultsDesc")}
              full
            />
          </div>

          {mySurveys.length > 0 && (
            <div className="mt-10">
              <div className="sondage-mono text-xs tracking-widest uppercase mb-3" style={{ color: SLATE }}>
                {t("recentSurveys")}
              </div>
              <div className="flex flex-col gap-2">
                {mySurveys.map((s) => (
                  <Link
                    key={s.id}
                    href={`/publie/${s.code}`}
                    className="sondage-btn sondage-option flex items-center justify-between py-2.5 px-3 text-left"
                    style={{ border: `1px solid ${SLATE}55`, background: "transparent" }}
                  >
                    <span className="sondage-sans text-sm truncate pr-3">{s.title || "Sans titre"}</span>
                    <span className="sondage-mono text-xs tracking-widest" style={{ color: OCHRE }}>
                      {s.code}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

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
