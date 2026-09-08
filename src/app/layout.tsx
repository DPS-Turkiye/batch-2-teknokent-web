import type { Metadata } from "next";

import { QueryProvider } from "@/components/providers/query-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { ToastProvider } from "@/components/providers/toast-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Mentorluk ve Girişim Programları Platformu",
    template: "%s | ODTÜ Teknokent",
  },
  description:
    "ODTÜ Teknokent mentorluk, eğitim ve girişim programları platformu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className="h-full antialiased"
      data-scroll-behavior="smooth"
    >
      <body
        suppressHydrationWarning
        className="flex min-h-full flex-col font-sans"
      >
        <QueryProvider>
          <ToastProvider>
            <SessionProvider>{children}</SessionProvider>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
