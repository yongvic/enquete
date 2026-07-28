"use client";

import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
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
    <div className="px-5 sm:px-8 pt-6 pb-4" style={{ borderBottom: `1px solid ${SLATE}44` }}>
      <div className="flex items-center justify-between max-w-3xl mx-auto gap-3">
        <Link href={isLoggedIn ? "/dashboard" : "/"} className="sondage-btn sondage-sans flex items-center gap-1.5 text-sm" style={{ color: INK }}>
          <ArrowLeft size={15} />
          <span className="sondage-mono text-xs tracking-widest uppercase">{t("appName")}</span>
        </Link>

        <div className="flex items-center gap-3">
          {isLoggedIn && (
            <>
              <Link href="/dashboard" className="sondage-sans text-[11px] tracking-wide uppercase hidden sm:inline" style={{ color: SLATE }}>
                {t("dashboard")}
              </Link>
              {isSuperAdmin(role) && (
                <Link href="/admin" className="sondage-sans text-[11px] tracking-wide uppercase hidden sm:inline" style={{ color: OCHRE }}>
                  {t("superadmin")}
                </Link>
              )}
            </>
          )}
          <LocaleSwitcher />
          {isLoggedIn ? (
            <button
              onClick={() => signOut({ callbackUrl: window.location.origin })}
              className="sondage-btn sondage-sans text-[11px] tracking-wide uppercase"
              style={{ color: SLATE }}
            >
              {t("logout")}
            </button>
          ) : (
            <Link href="/connexion" className="sondage-mono text-[11px] tracking-widest uppercase" style={{ color: SLATE }}>
              {t("login")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
