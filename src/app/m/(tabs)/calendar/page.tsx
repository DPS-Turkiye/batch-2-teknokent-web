import { MobileScreenHeader } from "@/components/mobile/mobile-app-shell";
import { MobileEmptyState } from "@/components/mobile/mobile-states";

export default function MobileCalendarPage() {
  return (
    <>
      <MobileScreenHeader title="Takvim" />
      <MobileEmptyState
        title="Takvim hazırlanıyor."
        description="Görüşmelerin ve son tarihlerin yakında burada."
      />
    </>
  );
}
