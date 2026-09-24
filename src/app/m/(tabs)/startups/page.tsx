import { MobileScreenHeader } from "@/components/mobile/mobile-app-shell";
import { MobileEmptyState } from "@/components/mobile/mobile-states";

export default function MobileStartupsPage() {
  return (
    <>
      <MobileScreenHeader title="Startuplarım" />
      <MobileEmptyState
        title="Startuplarım hazırlanıyor."
        description="Mentorluk yaptığın startuplar yakında burada."
      />
    </>
  );
}
