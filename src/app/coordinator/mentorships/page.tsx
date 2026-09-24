import { CoordinatorMentorshipsView } from "@/components/coordinator/mentorships-view";

export default async function CoordinatorMentorshipsPage({
  searchParams,
}: {
  searchParams: Promise<{ mentorship?: string }>;
}) {
  const { mentorship } = await searchParams;
  return <CoordinatorMentorshipsView initialSelectedId={mentorship ?? null} />;
}
