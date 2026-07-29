"use client";

import { Link } from "@/i18n/navigation";
import { LayoutDashboard, Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { SLATE, OCHRE } from "@/lib/constants";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { BrandLogo } from "./BrandLogo";
import { signOut } from "next-auth/react";
import { isSuperAdmin } from "@/lib/roles";
import { Role } from "@prisma/client";

interface HeaderProps {
  isLoggedIn?: boolean;
  role?: Role;
}

export function Header({ isLoggedIn, role }: HeaderProps) {
  const t = useTranslations("common");

  return (
    <div className="app-header px-4 sm:px-8 pt-4 sm:pt-5 pb-3 sm:pb-4 sticky top-0 z-20">
      <div className="flex items-center justify-between max-w-5xl mx-auto gap-2 sm:gap-3">
        <BrandLogo variant={isLoggedIn ? "icon" : "full"} href={isLoggedIn ? "/dashboard" : "/"} />

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {isLoggedIn && (
            <>
              <Link
                href="/dashboard"
                className="sondage-btn flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:py-0 sm:px-0"
                aria-label={t("dashboard")}
                title={t("dashboard")}
              >
                <LayoutDashboard size={18} className="sm:hidden" style={{ color: SLATE }} />
                <span className="sondage-sans text-[11px] tracking-wide uppercase hidden sm:inline" style={{ color: SLATE }}>
                  {t("dashboard")}
                </span>
              </Link>
              {isSuperAdmin(role) && (
                <Link
                  href="/admin"
                  className="sondage-btn flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto"
                  aria-label={t("superadmin")}
                  title={t("superadmin")}
                >
                  <Shield size={18} className="sm:hidden" style={{ color: OCHRE }} />
                  <span className="sondage-sans text-[11px] tracking-wide uppercase hidden sm:inline" style={{ color: OCHRE }}>
                    {t("superadmin")}
                  </span>
                </Link>
              )}
            </>
          )}
          <LocaleSwitcher />
          {isLoggedIn ? (
            <button
              onClick={() => signOut({ callbackUrl: window.location.origin })}
              className="sondage-btn sondage-sans text-[10px] sm:text-[11px] tracking-wide uppercase px-2 min-h-[40px] sm:min-h-[44px]"
              style={{ color: SLATE }}
            >
              {t("logout")}
            </button>
          ) : (
            <Link
              href="/connexion"
              className="sondage-sans text-xs sm:text-sm font-semibold px-3 py-2 min-h-[40px] flex items-center"
              style={{ color: OCHRE }}
            >
              {t("login")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
