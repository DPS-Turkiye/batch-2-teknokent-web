import { MobileScreenHeader } from "@/components/mobile/mobile-app-shell";
import { MobileEmptyState } from "@/components/mobile/mobile-states";

export default function MobileTasksPage() {
  return (
    <>
      <MobileScreenHeader title="Görevler" />
      <MobileEmptyState
        title="Görevler hazırlanıyor."
        description="Mentorunun verdiği görevler yakında burada."
      />
    </>
  );
}
