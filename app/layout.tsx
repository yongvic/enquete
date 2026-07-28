import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Enquête — Sondages CNAO",
  description: "Créez des sondages, collectez des réponses et analysez les résultats.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
