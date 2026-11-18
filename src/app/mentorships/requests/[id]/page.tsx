import { MentorRequestStartupDetail } from "@/components/mentorships/mentor-request-startup-detail";
import { isEnumValue } from "@/lib/enum";
import { MENTOR_REVIEW_PARAM } from "@/lib/mentorship-workspace";
import { MentorReviewMode } from "@/types/mentorship";

export default async function MentorshipRequestStartupPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const review = (await searchParams)[MENTOR_REVIEW_PARAM];
  return (
    <MentorRequestStartupDetail
      requestId={id}
      initialReview={isEnumValue(MentorReviewMode, review) ? review : null}
    />
  );
}
