import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: { default: "Menton", template: "%s | Menton" },
  appleWebApp: { capable: true, title: "Menton", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function MobileLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-dvh bg-white text-[#22262b]">{children}</div>;
}
