import { MobileScreenHeader } from "@/components/mobile/mobile-app-shell";
import { MobileEmptyState } from "@/components/mobile/mobile-states";

export default function MobileNotificationsPage() {
  return (
    <>
      <MobileScreenHeader title="Bildirimler" />
      <MobileEmptyState
        title="Bildirimler hazırlanıyor."
        description="Bildirim listesi ve ayarları yakında burada."
      />
    </>
  );
}
