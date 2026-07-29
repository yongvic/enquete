import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { AppShell } from "@/components/AppShell";
import { Providers } from "@/components/Providers";
import { JsonLd } from "@/components/JsonLd";
import { Analytics } from "@vercel/analytics/next";
import {
  buildPageMetadata,
  organizationJsonLd,
  softwareApplicationJsonLd,
} from "@/lib/seo";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({ locale });
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "fr" | "en")) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <JsonLd data={[organizationJsonLd(), softwareApplicationJsonLd(locale)]} />
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <AppShell>{children}</AppShell>
          </Providers>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
