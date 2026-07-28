import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Enquête — Sondages CNAO",
  description: "Créez des sondages, collectez des réponses et analysez les résultats.",
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
