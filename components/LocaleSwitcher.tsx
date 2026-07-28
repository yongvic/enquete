"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";

const labels: Record<string, Record<string, string>> = {
  fr: { fr: "FR", en: "EN" },
  en: { fr: "FR", en: "EN" },
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const other = locale === "fr" ? "en" : "fr";

  return (
    <button
      onClick={() => router.replace(pathname, { locale: other })}
      className="sondage-btn sondage-mono text-[11px] tracking-widest uppercase px-2 py-0.5"
      style={{ border: "1px solid #8B96A555", color: "#8B96A5" }}
      aria-label={`Switch to ${other}`}
    >
      {labels[locale][other]}
    </button>
  );
}
