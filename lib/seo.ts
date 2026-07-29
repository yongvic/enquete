import type { Metadata } from "next";
import { getAppUrl } from "@/lib/constants";
import { routing, type Locale } from "@/i18n/routing";

export const SITE_NAME = "Sondage";
export const SITE_TAGLINE = {
  fr: "Collecte & analyse de données",
  en: "Data collection & analysis",
} as const;

export const SITE_DESCRIPTION = {
  fr: "Créez des sondages pour vos mémoires et enquêtes de terrain. Partagez un lien ou un code, collectez des réponses sans compte, analysez avec graphiques, exports Excel/PDF et rapport IA.",
  en: "Create surveys for theses and field research. Share a link or code, collect answers without an account, analyze with charts, Excel/PDF exports and AI reports.",
} as const;

export const SITE_KEYWORDS = {
  fr: [
    "sondage",
    "enquête",
    "questionnaire en ligne",
    "collecte de données",
    "mémoire",
    "thèse",
    "enquête académique",
    "formulaire",
    "analyse de résultats",
    "export Excel",
    "rapport IA",
  ],
  en: [
    "survey",
    "online questionnaire",
    "data collection",
    "thesis survey",
    "academic research",
    "form builder",
    "results analysis",
    "Excel export",
    "AI report",
  ],
} as const;

export function getSiteUrl(): string {
  return getAppUrl().replace(/\/$/, "");
}

export function absoluteUrl(path = ""): string {
  const base = getSiteUrl();
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function localePath(locale: string, path = ""): string {
  const clean = path.startsWith("/") ? path : path ? `/${path}` : "";
  return `/${locale}${clean}`;
}

export function buildAlternates(locale: string, path = ""): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = absoluteUrl(localePath(loc, path));
  }
  languages["x-default"] = absoluteUrl(localePath(routing.defaultLocale, path));

  return {
    canonical: absoluteUrl(localePath(locale, path)),
    languages,
  };
}

export function buildPageMetadata({
  locale,
  title,
  description,
  path = "",
  noIndex = false,
  image,
}: {
  locale: string;
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
  image?: string;
}): Metadata {
  const loc = (locale === "en" ? "en" : "fr") as Locale;
  const desc = description ?? SITE_DESCRIPTION[loc];
  const fullTitle = title
    ? { absolute: `${title} · ${SITE_NAME}` }
    : { default: `${SITE_NAME} — ${SITE_TAGLINE[loc]}`, template: `%s · ${SITE_NAME}` };

  const ogImage = absoluteUrl(image ?? "/promo/promo-linkedin.png");
  const url = absoluteUrl(localePath(locale, path));

  return {
    metadataBase: new URL(getSiteUrl()),
    title: fullTitle,
    description: desc,
    keywords: [...SITE_KEYWORDS[loc]],
    authors: [{ name: "Young Vic", url: "https://github.com/yongvic" }],
    creator: "Young Vic",
    publisher: SITE_NAME,
    applicationName: SITE_NAME,
    category: "productivity",
    alternates: buildAlternates(locale, path),
    openGraph: {
      type: "website",
      locale: loc === "fr" ? "fr_FR" : "en_US",
      alternateLocale: loc === "fr" ? ["en_US"] : ["fr_FR"],
      url,
      siteName: SITE_NAME,
      title: title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} — ${SITE_TAGLINE[loc]}`,
      description: desc,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 628,
          alt: `${SITE_NAME} — ${SITE_TAGLINE[loc]}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} — ${SITE_TAGLINE[loc]}`,
      description: desc,
      images: [ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large" as const,
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    formatDetection: {
      telephone: false,
      email: false,
      address: false,
    },
  };
}

export function softwareApplicationJsonLd(locale: string) {
  const loc = (locale === "en" ? "en" : "fr") as Locale;
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: absoluteUrl(localePath(locale)),
    description: SITE_DESCRIPTION[loc],
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: [loc],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    creator: {
      "@type": "Person",
      name: "Young Vic",
      url: "https://github.com/yongvic",
    },
    featureList: [
      loc === "fr"
        ? "Création de sondages pas à pas"
        : "Step-by-step survey creation",
      loc === "fr"
        ? "Réponses sans compte"
        : "Answers without an account",
      loc === "fr"
        ? "Exports Excel et PDF"
        : "Excel and PDF exports",
      loc === "fr" ? "Rapport IA" : "AI report",
      loc === "fr" ? "Interface FR / EN" : "FR / EN interface",
    ],
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: getSiteUrl(),
    logo: absoluteUrl("/icon.png"),
    sameAs: [
      "https://github.com/yongvic/enquete",
      "https://www.linkedin.com/in/edo-yawo-sokpa-06617b333",
    ],
  };
}
