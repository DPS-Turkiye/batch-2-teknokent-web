import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import localFont from "next/font/local";
import { preload } from "react-dom";

import { DocumentPreviewHost } from "@/components/common/document-preview-host";
import { Toaster } from "@/components/common/toaster";
import { AccountTypeProvider } from "@/components/providers/account-type-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { ClientTexts } from "@/i18n/client-texts";
import { getAccountType } from "@/lib/server/account-type";

import "./globals.css";

// Bundled (latin + latin-ext, weights 400-700) so the build never downloads it: Google Fonts sometimes
// answers CI with font links next/font/google cannot resolve, and the build fails.
const inter = localFont({
  src: "./fonts/inter-latin-wght-400-700.woff2",
  weight: "400 700",
  display: "swap",
  variable: "--font-mentor-inter",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: { default: t("defaultTitle"), template: t("titleTemplate") },
    description: t("description"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, accountType] = await Promise.all([
    getLocale(),
    getAccountType(),
  ]);
  // The design system's headings use Manrope (globals.css); fetch its Latin face early so headings do not swap late.
  preload("/fonts/manrope-latin-wght.woff2", {
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  });
  return (
    <html
      lang={locale}
      className={`h-full antialiased ${inter.variable}`}
      data-scroll-behavior="smooth"
    >
      <body
        suppressHydrationWarning
        className="flex min-h-full flex-col font-sans"
      >
        <NextIntlClientProvider>
          <ClientTexts />
          <AccountTypeProvider accountType={accountType}>
            <QueryProvider>
              <SessionProvider>{children}</SessionProvider>
              <Toaster />
              <DocumentPreviewHost />
            </QueryProvider>
          </AccountTypeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
