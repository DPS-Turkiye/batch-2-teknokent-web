"use client";

import { useAppSession } from "@/components/providers/session-provider";
import { useMeetings } from "@/hooks/use-meetings";
import { useMentorAvailabilitySettings } from "@/hooks/use-mentor-profile";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { usePrograms } from "@/hooks/use-programs";
import type { MentorProfile } from "@/interfaces/mentor";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { programsMentorHasJoined } from "@/lib/meeting-targets";
import { menteeLoadLabel } from "@/lib/mentor-detail";
import {
  completedSessionCount,
  meetingPreferenceRows,
  mentorshipDurationLabel,
  mentorshipHistory,
  profileSubtitle,
  weeklyAvailabilityRows,
  workingStyleBullets,
} from "@/lib/mentor-profile-overview";

const LOADING = "…";
const MISSING = "—";

function countLabel(count: number | undefined) {
  return count === undefined ? MISSING : String(count);
}

/** Everything the mentor's own profile page shows besides the editable form. */
export function useMentorProfileOverview(profile: MentorProfile) {
  const session = useAppSession();
  const settingsQuery = useMentorAvailabilitySettings();
  const requestsQuery = useMentorshipRequests(UserRole.Mentor);
  const meetingsQuery = useMeetings();
  const programsQuery = usePrograms();

  const settings = settingsQuery.data;
  const meetings = meetingsQuery.data ?? [];
  // Accepted requests stay ACCEPTED after a mentorship ends, so they date the
  // history but never count as active; the active count comes from the backend.
  const accepted = (requestsQuery.data ?? []).filter(
    (request) => request.status === MentorshipRequestStatus.Accepted,
  );

  return {
    subtitle: profileSubtitle(profile),
    programs: programsMentorHasJoined(
      programsQuery.data ?? [],
      session?.userId,
    ),
    isProgramsLoading: programsQuery.isLoading,
    stats: [
      {
        label: "Aktif mentorluk",
        value: countLabel(profile.activeMenteeCount),
      },
      {
        label: "Tamamlanan",
        value: countLabel(profile.completedMentorshipCount),
      },
      {
        label: "Toplam seans",
        value: meetingsQuery.isLoading
          ? LOADING
          : String(completedSessionCount(meetings)),
      },
      {
        label: "Ortalama yanıt süresi",
        value: profile.responseTimeLabel?.trim() || MISSING,
      },
      {
        label: "Mentorluk süresi",
        value: requestsQuery.isLoading
          ? LOADING
          : (mentorshipDurationLabel(accepted) ?? MISSING),
      },
    ],
    weeklyAvailability: weeklyAvailabilityRows(settings?.rules ?? []),
    capacityLabel: menteeLoadLabel({
      ...profile,
      menteeCapacity: settings?.menteeCapacity ?? profile.menteeCapacity,
    }),
    isAvailabilityLoading: settingsQuery.isLoading,
    preferences: meetingPreferenceRows(profile, settings),
    workingStyle: workingStyleBullets(profile),
    history: mentorshipHistory(accepted, meetings),
    isHistoryLoading: requestsQuery.isLoading || meetingsQuery.isLoading,
  };
}
