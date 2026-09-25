import { MobileAppShell } from "@/components/mobile/mobile-app-shell";

export default function MobileChatLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <MobileAppShell bare>{children}</MobileAppShell>;
}
