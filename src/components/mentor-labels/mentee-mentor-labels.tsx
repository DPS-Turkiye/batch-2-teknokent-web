// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { MentorLabelChips } from "@/components/mentor-labels/mentor-label-chips";
import { useMentorLabelDirectory } from "@/hooks/use-mentor-labels";

/** A mentor's labels in the mentee's own program, for cards outside the mentor list (the request flow). */
export function MenteeMentorLabels({
  mentorId,
  className = "",
}: {
  mentorId: string;
  className?: string;
}) {
  const directory = useMentorLabelDirectory();
  return (
    <MentorLabelChips
      labels={directory.labelsOf(mentorId)}
      className={className}
    />
  );
}
