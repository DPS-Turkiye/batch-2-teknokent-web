"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";

import { MentorRequestFlow } from "@/components/mentor-request/mentor-request-flow";
import { useSession } from "@/components/providers/session-provider";
import { useStartupContext } from "@/hooks/use-mentor-pages";
import { useMentors } from "@/hooks/use-mentors";

export default function MentorRequestPage() {
  const t = useTranslations("loadErrors");
  const router = useRouter();
  const { isLoading: sessionLoading, session } = useSession();
  const organizationId = session?.organizationId;
  const mentors = useMentors({ enabled: Boolean(organizationId) });
  const startup = useStartupContext(organizationId);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) router.replace("/login");
    // Someone who signed up without a startup is told on Startup'ım how to get one.
    else if (!organizationId) router.replace("/startup");
  }, [organizationId, router, session, sessionLoading]);

  if (!organizationId || mentors.isPending || !startup.startup) return null;
  return (
    <Suspense>
      <MentorRequestFlow
        mentors={mentors.data ?? []}
        mentorLoadError={mentors.isError ? t("mentors") : undefined}
        startup={startup.startup}
        startupLoadError={startup.error ? t(startup.error) : undefined}
      />
    </Suspense>
  );
}
