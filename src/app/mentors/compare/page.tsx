import { MentorComparisonView } from "@/components/product-views";
import { loadMentors } from "@/lib/mentors";

export const dynamic = "force-dynamic";

export default async function MentorComparisonPage() {
  const { mentors, error } = await loadMentors();
  return <MentorComparisonView mentors={mentors} mentorLoadError={error} />;
}
