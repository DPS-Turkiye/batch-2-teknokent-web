import { MobileScreenHeader } from "@/components/mobile/mobile-app-shell";
import { MobileEmptyState } from "@/components/mobile/mobile-states";

export default function MobileMessagesPage() {
  return (
    <>
      <MobileScreenHeader title="Mesajlar" />
      <MobileEmptyState
        title="Mesajlar hazırlanıyor."
        description="Konuşmaların yakında burada."
      />
    </>
  );
}
