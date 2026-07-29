import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { absoluteUrl, localePath } from "@/lib/seo";

const PUBLIC_PATHS = ["", "/connexion", "/inscription", "/repondre"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return routing.locales.flatMap((locale) =>
    PUBLIC_PATHS.map((path) => ({
      url: absoluteUrl(localePath(locale, path)),
      lastModified: now,
      changeFrequency: path === "" ? "weekly" : "monthly",
      priority: path === "" ? 1 : path === "/repondre" ? 0.9 : 0.7,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((loc) => [loc, absoluteUrl(localePath(loc, path))])
        ),
      },
    }))
  );
}
