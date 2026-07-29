import { BrandLogo } from "./BrandLogo";
import { LandingHeader } from "./LandingHeader";
import { getTranslations } from "next-intl/server";

interface AuthShellProps {
  children: React.ReactNode;
  mode: "login" | "register";
}

export async function AuthShell({ children, mode }: AuthShellProps) {
  const t = await getTranslations("auth");

  return (
    <div className="auth-shell min-h-[100dvh] flex flex-col">
      <LandingHeader showAuthLinks={false} />
      <div className="flex-1 flex items-stretch">
        <aside className="auth-shell__brand hidden lg:flex lg:w-[42%] xl:w-[45%] flex-col justify-between p-10 xl:p-14">
          <BrandLogo variant="dark" href="/" className="opacity-95" />
          <div>
            <p className="auth-shell__tagline text-2xl xl:text-3xl font-bold leading-snug">
              {t("shellTagline")}
            </p>
            <p className="sondage-sans text-sm mt-4 leading-relaxed auth-shell__subtitle">
              {t("shellSubtitle")}
            </p>
          </div>
          <ul className="sondage-sans text-sm flex flex-col gap-3 auth-shell__features">
            <li>{t("shellFeature1")}</li>
            <li>{t("shellFeature2")}</li>
            <li>{t("shellFeature3")}</li>
          </ul>
        </aside>

        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-6 sm:py-12">
          <div className="auth-card w-full max-w-md p-6 sm:p-8">
            <h1 className="text-2xl sm:text-[1.65rem] font-bold tracking-tight">
              {mode === "login" ? t("loginTitle") : t("registerTitle")}
            </h1>
            <p className="sondage-sans text-sm mt-2 auth-card__lead">
              {mode === "login" ? t("loginLead") : t("registerLead")}
            </p>
            <div className="mt-7">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
