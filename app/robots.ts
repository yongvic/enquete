import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/fr", "/en", "/fr/connexion", "/en/connexion", "/fr/inscription", "/en/inscription", "/fr/repondre", "/en/repondre"],
        disallow: [
          "/fr/dashboard",
          "/en/dashboard",
          "/fr/admin",
          "/en/admin",
          "/fr/creer",
          "/en/creer",
          "/fr/publie/",
          "/en/publie/",
          "/fr/resultats/",
          "/en/resultats/",
          "/api/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
