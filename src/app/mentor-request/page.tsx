import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { MentorRequestFlow } from "@/components/mentor-request/mentor-request-flow";
import { loadMentors } from "@/lib/mentors";
import { getSessionUser } from "@/lib/session";
import { loadStartupContext } from "@/lib/startup-profile";

export const dynamic = "force-dynamic";

export default async function MentorRequestPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  // Someone who signed up without a startup is told on Startup'ım how to get one.
  if (!session.organizationId) redirect("/startup");
  const [t, { mentors, error: mentorError }, { startup, error: startupError }] =
    await Promise.all([
      getTranslations("loadErrors"),
      loadMentors(),
      loadStartupContext(session.organizationId),
    ]);

  return (
    <Suspense>
      <MentorRequestFlow
        mentors={mentors}
        mentorLoadError={mentorError ? t("mentors") : undefined}
        startup={startup}
        startupLoadError={startupError ? t(startupError) : undefined}
      />
    </Suspense>
  );
}
