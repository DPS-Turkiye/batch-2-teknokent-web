import { Suspense } from "react";
import { redirect } from "next/navigation";

import { MentorRequestFlow } from "@/components/mentor-request/mentor-request-flow";
import { loadMentors } from "@/lib/mentors";
import { getSessionUser } from "@/lib/session";
import { loadStartupContext } from "@/lib/startup-profile";

export const dynamic = "force-dynamic";

export default async function MentorRequestPage() {
  const session = await getSessionUser();
  if (!session?.organizationId) {
    redirect("/login");
  }
  const [{ mentors, error: mentorError }, { startup, error: startupError }] =
    await Promise.all([
      loadMentors(),
      loadStartupContext(session.organizationId, session.userId),
    ]);

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
