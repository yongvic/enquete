import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — ${SITE_TAGLINE.fr}`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION.fr,
    start_url: "/fr",
    display: "standalone",
    background_color: "#f7f5ef",
    theme_color: "#1e2a38",
    lang: "fr",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
