"use client";

import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { LayoutDashboard, Menu, Shield, X, PlusCircle, Home, MessageSquareReply } from "lucide-react";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { Role } from "@prisma/client";
import { INK, OCHRE, SLATE } from "@/lib/constants";
import { isSuperAdmin } from "@/lib/roles";
import { BrandLogo } from "./BrandLogo";
import { LocaleSwitcher } from "./LocaleSwitcher";

interface NavItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
  primary?: boolean;
  accent?: boolean;
  onClick?: () => void;
}

interface NavbarProps {
  isLoggedIn?: boolean;
  role?: Role;
  /** Hide login / register (auth pages) */
  compactAuth?: boolean;
  logoHref?: string;
  priority?: boolean;
}

function NavLink({
  item,
  active,
  onNavigate,
  className = "",
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  const base =
    "navbar-link sondage-btn sondage-sans text-sm font-medium flex items-center gap-2.5 w-full lg:w-auto px-3 py-3 lg:py-2 rounded-sm transition-colors";

  const style = item.primary
    ? { background: OCHRE, color: "#fff" }
    : item.accent
      ? { color: OCHRE }
      : active
        ? { color: INK, background: `${SLATE}18` }
        : { color: SLATE };

  if (item.onClick) {
    return (
      <button type="button" onClick={item.onClick} className={`${base} ${className}`} style={style}>
        {item.icon}
        {item.label}
      </button>
    );
  }

  return (
    <Link href={item.href} onClick={onNavigate} className={`${base} ${className}`} style={style}>
      {item.icon}
      {item.label}
    </Link>
  );
}

export function Navbar({ isLoggedIn, role, compactAuth = false, logoHref, priority }: NavbarProps) {
  const t = useTranslations("common");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const items: NavItem[] = [];

  if (isLoggedIn) {
    items.push(
      { href: "/dashboard", label: t("dashboard"), icon: <LayoutDashboard size={18} /> },
      { href: "/creer", label: t("nav.create"), icon: <PlusCircle size={18} /> },
      { href: "/repondre", label: t("nav.answer"), icon: <MessageSquareReply size={18} /> },
    );
    if (isSuperAdmin(role)) {
      items.push({ href: "/admin", label: t("superadmin"), icon: <Shield size={18} />, accent: true });
    }
  } else {
    items.push(
      { href: "/", label: t("nav.home"), icon: <Home size={18} /> },
      { href: "/repondre", label: t("nav.answer"), icon: <MessageSquareReply size={18} /> },
    );
    if (!compactAuth) {
      items.push(
        { href: "/connexion", label: t("login") },
        { href: "/inscription", label: t("register"), primary: true },
      );
    }
  }

  const logoTarget = logoHref ?? (isLoggedIn ? "/dashboard" : "/");

  return (
    <header className="navbar app-header sticky top-0 z-30 px-4 sm:px-8 py-3 sm:py-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 min-w-0">
        <div className="min-w-0 shrink">
          <BrandLogo variant="full" href={logoTarget} priority={priority} className="header-logo" />
        </div>

        <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center" aria-label={t("nav.main")}>
          {items.map((item) => (
            <NavLink key={item.href + item.label} item={item} active={isActive(item.href)} />
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden lg:block">
            <LocaleSwitcher />
          </div>

          {isLoggedIn && (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: window.location.origin })}
              className="navbar-link sondage-btn sondage-sans text-[11px] tracking-wide uppercase px-3 hidden lg:inline-flex"
              style={{ color: SLATE }}
            >
              {t("logout")}
            </button>
          )}

          <button
            type="button"
            className="navbar-menu-btn sondage-btn flex lg:hidden items-center justify-center w-11 h-11"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? t("nav.closeMenu") : t("nav.menu")}
          >
            {open ? <X size={22} style={{ color: INK }} /> : <Menu size={22} style={{ color: INK }} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="navbar-drawer lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/35" aria-label={t("nav.closeMenu")} onClick={close} />
          <div className="navbar-drawer__panel absolute top-0 right-0 h-full w-[min(100%,20rem)] flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: `${SLATE}33` }}>
              <span className="sondage-mono text-[11px] tracking-widest uppercase" style={{ color: SLATE }}>
                {t("nav.menu")}
              </span>
              <button type="button" onClick={close} className="sondage-btn p-2" aria-label={t("nav.closeMenu")}>
                <X size={20} style={{ color: INK }} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1" aria-label={t("nav.main")}>
              {items.map((item) => (
                <NavLink key={item.href + item.label} item={item} active={isActive(item.href)} onNavigate={close} />
              ))}
            </nav>

            <div className="p-4 border-t flex flex-col gap-3" style={{ borderColor: `${SLATE}33` }}>
              <LocaleSwitcher />
              {isLoggedIn && (
                <button
                  type="button"
                  onClick={() => {
                    close();
                    signOut({ callbackUrl: window.location.origin });
                  }}
                  className="navbar-link sondage-btn sondage-sans text-sm font-medium w-full px-3 py-3 text-left"
                  style={{ color: SLATE }}
                >
                  {t("logout")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
