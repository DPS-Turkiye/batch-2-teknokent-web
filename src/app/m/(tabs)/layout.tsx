import { MobileAppShell } from "@/components/mobile/mobile-app-shell";

export default function MobileTabsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <MobileAppShell>{children}</MobileAppShell>;
}
