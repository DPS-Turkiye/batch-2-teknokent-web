import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { LocaleProvider } from "@/components/providers/locale-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { DocumentPreviewProvider } from "@/components/providers/document-preview-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { getLocale } from "@/lib/server/locale";

import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-mentor-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Mentorluk ve Girişim Programları Platformu",
    template: "%s | ODTÜ Teknokent",
  },
  description:
    "ODTÜ Teknokent mentorluk, eğitim ve girişim programları platformu.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
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
        <LocaleProvider locale={locale}>
          <QueryProvider>
            <ToastProvider>
              <DocumentPreviewProvider>
                <SessionProvider>{children}</SessionProvider>
              </DocumentPreviewProvider>
            </ToastProvider>
          </QueryProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
