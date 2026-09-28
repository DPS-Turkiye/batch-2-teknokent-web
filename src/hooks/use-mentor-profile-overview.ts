"use client";

import { useMeetings } from "@/hooks/use-meetings";
import { useMentorAvailabilitySettings } from "@/hooks/use-mentor-profile";
import { useMentorRating } from "@/hooks/use-mentor-rating";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import type { MentorProfile } from "@/interfaces/mentor";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { ProgramStatus } from "@/interfaces/program";
import { UserRole } from "@/interfaces/session";
import { menteeLoadLabel } from "@/lib/mentor-detail";
import {
  completedSessionCount,
  languagesLabel,
  meetingPreferenceRows,
  mentorshipDurationLabel,
  mentorshipHistory,
  programDetail,
  profileSubtitle,
  ratingLabel,
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
  const settingsQuery = useMentorAvailabilitySettings();
  const requestsQuery = useMentorshipRequests(UserRole.Mentor);
  const meetingsQuery = useMeetings();
  const ratingQuery = useMentorRating(profile.id);
  const ratingByRequest = Object.fromEntries(
    (ratingQuery.data?.mentorships ?? []).map((row) => [
      row.mentorshipRequestId,
      row.average,
    ]),
  );

  const settings = settingsQuery.data;
  const meetings = meetingsQuery.data ?? [];
  // Accepted requests stay ACCEPTED after a mentorship ends, so they date the
  // history but never count as active; the active count comes from the backend.
  const accepted = (requestsQuery.data ?? []).filter(
    (request) => request.status === MentorshipRequestStatus.Accepted,
  );
  // Active programs come first, as in the design; the backend orders by name.
  const programs = (profile.programs ?? [])
    .map((program) => ({ ...program, detail: programDetail(program) }))
    .sort(
      (left, right) =>
        Number(left.status !== ProgramStatus.Active) -
        Number(right.status !== ProgramStatus.Active),
    );

  return {
    subtitle: profileSubtitle(profile),
    activePrograms: programs.filter(
      (program) => program.status === ProgramStatus.Active,
    ),
    programs,
    languages: languagesLabel(profile.languages),
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
        label: "Ortalama değerlendirme",
        value: ratingQuery.isLoading
          ? LOADING
          : (ratingLabel(ratingQuery.data?.average) ?? MISSING),
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
    history: mentorshipHistory(accepted, meetings, ratingByRequest),
    isHistoryLoading: requestsQuery.isLoading || meetingsQuery.isLoading,
  };
}
