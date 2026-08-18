import { Suspense } from "react";

import { MentorRequestFlow } from "@/components/mentor-request/mentor-request-flow";
import { loadMentors } from "@/lib/mentors";
import { getSessionIds } from "@/lib/session";
import { loadStartupContext } from "@/lib/startup-profile";

export const dynamic = "force-dynamic";

export default async function MentorRequestPage() {
  const { organizationId } = await getSessionIds();
  const [{ mentors, error: mentorError }, { startup, error: startupError }] =
    await Promise.all([loadMentors(), loadStartupContext(organizationId)]);

  return (
    <Suspense>
      <MentorRequestFlow
        mentors={mentors}
        mentorLoadError={mentorError}
        startup={startup}
        startupLoadError={startupError}
      />
    </Suspense>
  );
}
