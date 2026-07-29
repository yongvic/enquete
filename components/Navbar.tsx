"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, usePathname } from "@/i18n/navigation";
import {
  LayoutDashboard,
  Menu,
  Shield,
  X,
  PlusCircle,
  Home,
  MessageSquareReply,
  ChevronRight,
  LogIn,
  UserPlus,
  LogOut,
} from "lucide-react";
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
  description?: string;
  icon?: React.ReactNode;
  primary?: boolean;
  accent?: boolean;
  featured?: boolean;
  onClick?: () => void;
}

interface NavbarProps {
  isLoggedIn?: boolean;
  role?: Role;
  compactAuth?: boolean;
  logoHref?: string;
  priority?: boolean;
}

function DesktopNavLink({ item, active }: { item: NavItem; active: boolean }) {
  const style: React.CSSProperties = item.accent
    ? { color: OCHRE }
    : active
      ? { color: INK, background: `${SLATE}18`, fontWeight: 600 }
      : { color: SLATE };

  return (
    <Link
      href={item.href}
      className="navbar-link sondage-btn sondage-sans text-sm font-medium flex items-center gap-2 px-3.5 py-2 rounded-md transition-colors"
      style={style}
    >
      {item.icon}
      {item.label}
    </Link>
  );
}

function MobileNavCard({
  item,
  active,
  onNavigate,
  variant = "default",
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
  variant?: "default" | "featured" | "primary";
}) {
  const className = [
    "mobile-nav-card sondage-btn w-full text-left",
    variant === "featured" ? "mobile-nav-card--featured" : "",
    variant === "primary" ? "mobile-nav-card--primary" : "",
    active ? "mobile-nav-card--active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {item.icon && <span className="mobile-nav-card__icon">{item.icon}</span>}
      <span className="mobile-nav-card__body">
        <span className="mobile-nav-card__label">{item.label}</span>
        {item.description && <span className="mobile-nav-card__desc">{item.description}</span>}
      </span>
      {variant !== "primary" && (
        <ChevronRight size={18} className="mobile-nav-card__chevron shrink-0" aria-hidden />
      )}
    </>
  );

  if (item.onClick) {
    return (
      <button type="button" onClick={item.onClick} className={className}>
        {content}
      </button>
    );
  }

  return (
    <Link href={item.href} onClick={onNavigate} className={className}>
      {content}
    </Link>
  );
}

export function Navbar({ isLoggedIn, role, compactAuth = false, logoHref, priority }: NavbarProps) {
  const t = useTranslations("common");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
  const mobileMain: NavItem[] = [];
  const mobileAccount: NavItem[] = [];

  if (isLoggedIn) {
    const dashboardItem: NavItem = {
      href: "/dashboard",
      label: t("dashboard"),
      description: t("nav.dashboardDesc"),
      icon: <LayoutDashboard size={22} strokeWidth={2} />,
      featured: true,
    };

    desktopItems.push({
      href: "/dashboard",
      label: t("dashboard"),
      icon: <LayoutDashboard size={17} strokeWidth={2} />,
    });

    mobileMain.push(dashboardItem);
    mobileMain.push(
      { href: "/creer", label: t("nav.create"), description: t("nav.createDesc"), icon: <PlusCircle size={20} /> },
      { href: "/repondre", label: t("nav.answer"), description: t("nav.answerDesc"), icon: <MessageSquareReply size={20} /> },
    );

    if (isSuperAdmin(role)) {
      const adminItem: NavItem = {
        href: "/admin",
        label: t("superadmin"),
        description: t("nav.adminDesc"),
        icon: <Shield size={20} />,
        accent: true,
      };
      desktopItems.push(adminItem);
      mobileMain.push(adminItem);
    }
  } else {
    mobileMain.push(
      { href: "/", label: t("nav.home"), description: t("nav.homeDesc"), icon: <Home size={20} /> },
      { href: "/repondre", label: t("nav.answer"), description: t("nav.answerDesc"), icon: <MessageSquareReply size={20} /> },
    );
    if (!compactAuth) {
      mobileAccount.push(
        { href: "/connexion", label: t("login"), description: t("nav.loginDesc"), icon: <LogIn size={20} /> },
        { href: "/inscription", label: t("register"), description: t("nav.registerDesc"), icon: <UserPlus size={20} />, primary: true },
      );
    }
  }

  const logoTarget = logoHref ?? (isLoggedIn ? "/dashboard" : "/");

  const mobileDrawer =
    open && mounted ? (
      <div className="navbar-drawer lg:hidden" role="dialog" aria-modal="true">
        <button type="button" className="navbar-drawer__backdrop" aria-label={t("nav.closeMenu")} onClick={close} />

        <div className="navbar-drawer__panel">
          <div className="navbar-drawer__handle" aria-hidden />

          <div className="navbar-drawer__hero">
            <div className="navbar-drawer__hero-top">
              <BrandLogo variant="icon" href={logoTarget} className="navbar-drawer__logo" />
              <button type="button" onClick={close} className="navbar-drawer__close sondage-btn" aria-label={t("nav.closeMenu")}>
                <X size={20} />
              </button>
            </div>
            <p className="navbar-drawer__eyebrow sondage-mono">{t("nav.menu")}</p>
            <p className="navbar-drawer__tagline sondage-sans">
              {isLoggedIn ? t("nav.menuLoggedIn") : t("nav.menuGuest")}
            </p>
          </div>

          <div className="navbar-drawer__scroll">
            {isLoggedIn && mobileMain[0]?.featured && (
              <div className="navbar-drawer__featured px-4 pt-2 pb-1">
                <MobileNavCard
                  item={mobileMain[0]}
                  active={isActive(mobileMain[0].href)}
                  onNavigate={close}
                  variant="featured"
                />
              </div>
            )}

            {mobileMain.length > (isLoggedIn ? 1 : 0) && (
              <div className="navbar-drawer__section px-4">
                <p className="navbar-drawer__section-label sondage-mono">{t("nav.sectionNav")}</p>
                <div className="navbar-drawer__grid">
                  {mobileMain.slice(isLoggedIn ? 1 : 0).map((item) => (
                    <MobileNavCard
                      key={item.href + item.label}
                      item={item}
                      active={isActive(item.href)}
                      onNavigate={close}
                      variant="default"
                    />
                  ))}
                </div>
              </div>
            )}

            {mobileAccount.length > 0 && (
              <div className="navbar-drawer__section px-4">
                <p className="navbar-drawer__section-label sondage-mono">{t("nav.sectionAccount")}</p>
                <div className="navbar-drawer__stack">
                  {mobileAccount.map((item) => (
                    <MobileNavCard
                      key={item.href + item.label}
                      item={item}
                      active={isActive(item.href)}
                      onNavigate={close}
                      variant={item.primary ? "primary" : "default"}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="navbar-drawer__foot">
            <div className="navbar-drawer__locale">
              <span className="sondage-mono text-[10px] tracking-widest uppercase" style={{ color: SLATE }}>
                {t("nav.language")}
              </span>
              <LocaleSwitcher />
            </div>
            {isLoggedIn && (
              <button
                type="button"
                onClick={() => {
                  close();
                  signOut({ callbackUrl: window.location.origin });
                }}
                className="navbar-drawer__logout sondage-btn sondage-sans w-full flex items-center justify-center gap-2"
              >
                <LogOut size={16} />
                {t("logout")}
              </button>
            )}
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
    <header className="navbar app-header sticky top-0 z-30 px-4 sm:px-8 py-3 sm:py-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 min-w-0">
        <div className="min-w-0 shrink">
          <BrandLogo variant="full" href={logoTarget} priority={priority} className="header-logo" />
        </div>

        {desktopItems.length > 0 && (
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center" aria-label={t("nav.main")}>
            {desktopItems.map((item) => (
              <DesktopNavLink key={item.href + item.label} item={item} active={isActive(item.href)} />
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2 shrink-0">
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
            className={`navbar-menu-btn sondage-btn flex lg:hidden items-center justify-center w-11 h-11 ${open ? "navbar-menu-btn--open" : ""}`}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? t("nav.closeMenu") : t("nav.menu")}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </header>

      {mobileDrawer && createPortal(mobileDrawer, document.body)}
    </>
  );
}
