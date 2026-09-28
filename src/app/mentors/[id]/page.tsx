import { notFound } from "next/navigation";

import { MentorDetailView } from "@/components/mentors/mentor-detail-view";
import { AppShell } from "@/components/hoc/app-shell";
import type { MentorAvailabilitySlot } from "@/interfaces/mentor";
import { fetchMentorAvailability } from "@/lib/api/mentor-profile";
import { loadMentors } from "@/lib/mentors";
import { getSessionUser } from "@/lib/session";
import { loadStartupContext } from "@/lib/startup-profile";
import { AppArea } from "@/types/app-area";

export const dynamic = "force-dynamic";

function isAvailabilitySlot(value: unknown): value is MentorAvailabilitySlot {
  if (!value || typeof value !== "object") return false;
  const slot = value as Record<string, unknown>;
  return (
    typeof slot.id === "string" &&
    typeof slot.startsAt === "string" &&
    typeof slot.durationMinutes === "number" &&
    typeof slot.booked === "boolean"
  );
}

async function loadMentorSlots(
  mentorId: string,
): Promise<MentorAvailabilitySlot[]> {
  try {
    const response = await fetchMentorAvailability(mentorId);
    if (response.status !== 200 || !Array.isArray(response.data)) return [];
    return response.data.filter(isAvailabilitySlot);
  } catch {
    return [];
  }
}

export default async function MentorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSessionUser();
  const { mentors } = await loadMentors();
  const mentor = mentors.find((item) => item.id === id);
  if (!mentor) notFound();

  const [slots, startupResult] = await Promise.all([
    loadMentorSlots(id),
    session?.organizationId
      ? loadStartupContext(session.organizationId, session.userId)
      : Promise.resolve({
          startup: {
            organizationId: "",
            name: "",
            summary: "",
            sector: "",
            stage: "",
            technologies: [] as string[],
            confirmedProfile: false,
          },
        }),
  ]);

  return (
    <AppShell active={AppArea.Mentorships} menteeHome>
      <MentorDetailView
        mentor={mentor}
        slots={slots}
        startup={startupResult.startup}
      />
    </AppShell>
  );
}
