import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

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
