"use client";

import { Link } from "@/i18n/navigation";
import { ArrowLeft, LayoutDashboard, Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { INK, SLATE, OCHRE } from "@/lib/constants";
import { LocaleSwitcher } from "./LocaleSwitcher";
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
    <div className="px-4 sm:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4 sticky top-0 z-20" style={{ borderBottom: `1px solid ${SLATE}44`, background: "#F7F5EF" }}>
      <div className="flex items-center justify-between max-w-3xl mx-auto gap-2 sm:gap-3">
        <Link
          href={isLoggedIn ? "/dashboard" : "/"}
          className="sondage-btn sondage-sans flex items-center gap-1.5 text-sm min-h-0 py-1"
          style={{ color: INK }}
        >
          <ArrowLeft size={15} className="shrink-0" />
          <span className="sondage-mono text-xs tracking-widest uppercase truncate max-w-[120px] sm:max-w-none">
            {t("appName")}
          </span>
        </Link>

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
              className="sondage-mono text-[10px] sm:text-[11px] tracking-widest uppercase px-1 min-h-[40px] flex items-center"
              style={{ color: SLATE }}
            >
              {t("login")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
