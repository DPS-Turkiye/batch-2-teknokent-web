import { MobileAppShell } from "@/components/mobile/mobile-app-shell";

export default function MobileDetailLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <MobileAppShell bare>{children}</MobileAppShell>;
}
