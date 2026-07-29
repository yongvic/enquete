import type { Metadata, Viewport } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildPageMetadata({ locale: "fr" }),
  title: {
    default: "Sondage — Collecte & analyse de données",
    template: "%s · Sondage",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5ef" },
    { media: "(prefers-color-scheme: dark)", color: "#1e2a38" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
