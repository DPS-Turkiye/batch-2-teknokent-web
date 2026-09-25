import { MobileStartupView } from "@/components/mobile/mobile-startup-view";

export default async function MobileStartupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MobileStartupView organizationId={id} />;
}
