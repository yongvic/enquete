import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: {
    default: "Sondage — Collecte & analyse de données",
    template: "%s · Sondage",
  },
  description:
    "Créez des sondages, collectez des réponses sans compte et analysez vos résultats avec graphiques, exports Excel/PDF et rapport IA.",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/icon.png", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
