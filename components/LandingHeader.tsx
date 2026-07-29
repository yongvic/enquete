"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { BrandLogo } from "./BrandLogo";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { OCHRE, SLATE } from "@/lib/constants";

interface LandingHeaderProps {
  showAuthLinks?: boolean;
}

export function LandingHeader({ showAuthLinks = true }: LandingHeaderProps) {
  const t = useTranslations("common");

  return (
    <header className="landing-header px-4 sm:px-8 py-4 sm:py-5 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <BrandLogo variant="full" priority className="header-logo" />
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <LocaleSwitcher />
          {showAuthLinks && (
            <>
              <Link
                href="/connexion"
                className="sondage-btn sondage-sans text-xs sm:text-sm px-3 py-2 hidden sm:inline-flex"
                style={{ color: SLATE }}
              >
                {t("login")}
              </Link>
              <Link
                href="/inscription"
                className="sondage-btn sondage-sans text-xs sm:text-sm px-4 py-2 text-white"
                style={{ background: OCHRE }}
              >
                {t("register")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
