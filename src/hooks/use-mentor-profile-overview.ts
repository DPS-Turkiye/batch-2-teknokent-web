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

/** Everything the mentor's own profile page shows besides the editable form. */
export function useMentorProfileOverview(profile: MentorProfile) {
  const session = useAppSession();
  const settingsQuery = useMentorAvailabilitySettings();
  const requestsQuery = useMentorshipRequests(UserRole.Mentor);
  const meetingsQuery = useMeetings();
  const programsQuery = usePrograms();

  const settings = settingsQuery.data;
  const meetings = meetingsQuery.data ?? [];
  const accepted = (requestsQuery.data ?? []).filter(
    (request) => request.status === MentorshipRequestStatus.Accepted,
  );
  const activeCount = profile.activeMenteeCount ?? accepted.length;

  return {
    subtitle: profileSubtitle(profile),
    programs: programsMentorHasJoined(
      programsQuery.data ?? [],
      session?.userId,
    ),
    stats: [
      { label: "Aktif mentorluk", value: String(activeCount) },
      {
        label: "Tamamlanan",
        value: String(profile.completedMentorshipCount ?? 0),
      },
      { label: "Toplam seans", value: String(completedSessionCount(meetings)) },
      {
        label: "Ortalama yanıt süresi",
        value: profile.responseTimeLabel?.trim() || "—",
      },
      {
        label: "Mentorluk süresi",
        value: mentorshipDurationLabel(accepted) ?? "—",
      },
    ],
    weeklyAvailability: weeklyAvailabilityRows(settings?.rules ?? []),
    capacityLabel: menteeLoadLabel({
      ...profile,
      activeMenteeCount: activeCount,
      menteeCapacity: settings?.menteeCapacity ?? profile.menteeCapacity,
    }),
    isAvailabilityLoading: settingsQuery.isLoading,
    preferences: meetingPreferenceRows(profile, settings),
    workingStyle: workingStyleBullets(profile),
    history: mentorshipHistory(accepted, meetings),
  };
}
