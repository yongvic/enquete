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
  featured?: boolean;
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
  mobile = false,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
  mobile?: boolean;
}) {
  const base = mobile
    ? "navbar-drawer__link sondage-btn sondage-sans font-medium flex items-center gap-3 w-full px-4 py-3.5 rounded-md transition-colors"
    : "navbar-link sondage-btn sondage-sans text-sm font-medium flex items-center gap-2 px-3 py-2 rounded-sm transition-colors";

  let style: React.CSSProperties;
  if (item.primary) {
    style = { background: OCHRE, color: "#fff" };
  } else if (item.featured) {
    style = {
      background: `${OCHRE}14`,
      color: INK,
      border: `1px solid ${OCHRE}55`,
    };
  } else if (item.accent) {
    style = { color: OCHRE };
  } else if (active) {
    style = mobile
      ? { color: INK, background: `${SLATE}22`, fontWeight: 600 }
      : { color: INK, background: `${SLATE}18` };
  } else {
    style = mobile ? { color: INK } : { color: SLATE };
  }

  if (item.onClick) {
    return (
      <button type="button" onClick={item.onClick} className={base} style={style}>
        {item.icon}
        <span>{item.label}</span>
      </button>
    );
  }

  return (
    <Link href={item.href} onClick={onNavigate} className={base} style={style}>
      {item.icon}
      <span>{item.label}</span>
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

  const desktopItems: NavItem[] = [];
  const mobileItems: NavItem[] = [];

  if (isLoggedIn) {
    mobileItems.push(
      { href: "/dashboard", label: t("dashboard"), icon: <LayoutDashboard size={20} />, featured: true },
      { href: "/creer", label: t("nav.create"), icon: <PlusCircle size={20} /> },
      { href: "/repondre", label: t("nav.answer"), icon: <MessageSquareReply size={20} /> },
    );
    if (isSuperAdmin(role)) {
      const adminItem = { href: "/admin", label: t("superadmin"), icon: <Shield size={20} />, accent: true };
      mobileItems.push(adminItem);
      desktopItems.push(adminItem);
    }
  } else {
    mobileItems.push(
      { href: "/", label: t("nav.home"), icon: <Home size={20} /> },
      { href: "/repondre", label: t("nav.answer"), icon: <MessageSquareReply size={20} /> },
    );
    if (!compactAuth) {
      mobileItems.push(
        { href: "/connexion", label: t("login"), icon: undefined },
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

        {desktopItems.length > 0 && (
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-end mr-2" aria-label={t("nav.main")}>
            {desktopItems.map((item) => (
              <NavLink key={item.href + item.label} item={item} active={isActive(item.href)} />
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <div className="hidden lg:block">
            <LocaleSwitcher />
          </div>

          {!isLoggedIn && !compactAuth && (
            <div className="hidden lg:flex items-center gap-2">
              <Link
                href="/connexion"
                className="navbar-link sondage-btn sondage-sans text-sm font-medium px-3 py-2"
                style={{ color: SLATE }}
              >
                {t("login")}
              </Link>
              <Link
                href="/inscription"
                className="navbar-link sondage-btn sondage-sans text-sm font-semibold px-4 py-2 text-white"
                style={{ background: OCHRE }}
              >
                {t("register")}
              </Link>
            </div>
          )}

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
          <button type="button" className="navbar-drawer__backdrop absolute inset-0" aria-label={t("nav.closeMenu")} onClick={close} />
          <div className="navbar-drawer__panel absolute top-0 right-0 h-full flex flex-col">
            <div className="navbar-drawer__head flex items-center justify-between px-5 py-4">
              <span className="sondage-mono text-xs tracking-widest uppercase font-semibold" style={{ color: INK }}>
                {t("nav.menu")}
              </span>
              <button type="button" onClick={close} className="sondage-btn p-2 -mr-1" aria-label={t("nav.closeMenu")}>
                <X size={22} style={{ color: INK }} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-2" aria-label={t("nav.main")}>
              {mobileItems.map((item) => (
                <NavLink
                  key={item.href + item.label}
                  item={item}
                  active={isActive(item.href)}
                  onNavigate={close}
                  mobile
                />
              ))}
            </nav>

            <div className="navbar-drawer__foot px-5 py-5 flex flex-col gap-3">
              <LocaleSwitcher />
              {isLoggedIn && (
                <button
                  type="button"
                  onClick={() => {
                    close();
                    signOut({ callbackUrl: window.location.origin });
                  }}
                  className="navbar-drawer__link sondage-btn sondage-sans text-sm font-medium w-full px-4 py-3.5 text-left rounded-md"
                  style={{ color: SLATE, border: `1px solid ${SLATE}44` }}
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
