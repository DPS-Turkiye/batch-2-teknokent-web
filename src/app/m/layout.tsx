import type { Metadata, Viewport } from "next";

import { Edition } from "@/interfaces/edition";
import { requireEdition } from "@/lib/server/edition";

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

/** The proxy closes /m outside Teknokent, but it skips paths with a dot, which a [id] segment can carry. */
export default async function MobileLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireEdition(Edition.Teknokent);
  return <div className="min-h-dvh bg-white text-[#22262b]">{children}</div>;
}
