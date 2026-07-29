import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { LandingHeader } from "./LandingHeader";
import { BrandLogo } from "./BrandLogo";
import {
  BarChart3,
  ClipboardList,
  FileSpreadsheet,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { INK, OCHRE, SLATE } from "@/lib/constants";

export async function HomeLanding() {
  const t = await getTranslations("home");

  return (
    <>
      <LandingHeader />
      <div className="landing-hero px-4 sm:px-8 pb-16 pt-4 sm:pt-8">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <section className="landing-hero__main grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div>
              <div className="lg:hidden mb-6">
                <BrandLogo variant="full" href="/" priority />
              </div>
              <p className="sondage-mono text-[11px] tracking-[0.2em] uppercase mb-4" style={{ color: OCHRE }}>
                {t("eyebrow")}
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-bold leading-[1.12] tracking-tight whitespace-pre-line">
                {t("title")}
              </h1>
              <p className="sondage-sans text-base sm:text-[17px] mt-5 leading-relaxed landing-hero__subtitle">
                {t("subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <Link
                  href="/inscription"
                  className="sondage-btn sondage-sans text-sm px-6 py-3.5 text-center text-white font-semibold"
                  style={{ background: OCHRE }}
                >
                  {t("ctaPrimary")}
                </Link>
                <Link
                  href="/connexion"
                  className="sondage-btn sondage-sans text-sm px-6 py-3.5 text-center font-semibold landing-hero__cta-secondary"
                >
                  {t("ctaSecondary")}
                </Link>
              </div>
            </div>

            <div className="landing-hero__visual hidden lg:flex items-center justify-center p-8 rounded-sm">
              <BrandLogo variant="dark" href="/" priority className="!h-auto !max-w-[320px]" />
            </div>
          </section>

          {/* Features */}
          <section className="mt-16 sm:mt-20">
            <h2 className="sondage-mono text-xs tracking-[0.18em] uppercase mb-6" style={{ color: SLATE }}>
              {t("featuresTitle")}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FeatureCard icon={<Users size={20} />} title={t("feature1Title")} desc={t("feature1Desc")} />
              <FeatureCard icon={<BarChart3 size={20} />} title={t("feature2Title")} desc={t("feature2Desc")} />
              <FeatureCard icon={<FileSpreadsheet size={20} />} title={t("feature3Title")} desc={t("feature3Desc")} />
              <FeatureCard icon={<Sparkles size={20} />} title={t("feature4Title")} desc={t("feature4Desc")} />
              <FeatureCard icon={<UserPlus size={20} />} title={t("feature5Title")} desc={t("feature5Desc")} />
              <FeatureCard icon={<ClipboardList size={20} />} title={t("feature6Title")} desc={t("feature6Desc")} />
            </div>
          </section>

          {/* Paths */}
          <section className="mt-16 sm:mt-20 grid sm:grid-cols-2 gap-4">
            <PathCard
              href="/inscription"
              title={t("create")}
              desc={t("createDesc")}
              accent
            />
            <PathCard href="/repondre" title={t("answer")} desc={t("answerDesc")} />
          </section>

          <p className="sondage-sans text-xs text-center mt-12 py-3 px-4 rounded-sm landing-hero__note">
            {t("noAccountRespondent")}
          </p>
        </div>
      </div>
    </>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="landing-feature p-5">
      <div style={{ color: OCHRE }}>{icon}</div>
      <h3 className="font-bold text-[15px] mt-3">{title}</h3>
      <p className="sondage-sans text-sm mt-1.5 leading-relaxed" style={{ color: `${INK}99` }}>
        {desc}
      </p>
    </div>
  );
}

function PathCard({
  href,
  title,
  desc,
  accent,
}: {
  href: string;
  title: string;
  desc: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className="landing-path p-6 sm:p-7 block"
      style={accent ? { borderColor: OCHRE, background: `${OCHRE}0c` } : undefined}
    >
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="sondage-sans text-sm mt-2 leading-relaxed" style={{ color: `${INK}99` }}>
        {desc}
      </p>
      <span className="sondage-sans text-xs font-semibold mt-4 inline-block" style={{ color: OCHRE }}>
        →
      </span>
    </Link>
  );
}
