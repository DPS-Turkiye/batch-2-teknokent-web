import { MobileScreenHeader } from "@/components/mobile/mobile-app-shell";
import { MobileEmptyState } from "@/components/mobile/mobile-states";

export default function MobileHomePage() {
  return (
    <>
      <MobileScreenHeader title="Ana Sayfa" />
      <MobileEmptyState
        title="Ana sayfa hazırlanıyor."
        description="Sıradaki görüşmen ve yapılacakların yakında burada."
      />
    </>
  );
}
