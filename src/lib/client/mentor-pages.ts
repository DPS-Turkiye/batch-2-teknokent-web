import type {
  MentorAvailabilitySlot,
  MentorProfile,
} from "@/interfaces/mentor";
import type { OrganizationPrograms } from "@/interfaces/program";
import { backendHttp } from "@/lib/client/backend-http";
import {
  MentorPageAccess,
  mentorPageAccess,
  sharedProgramNames,
} from "@/lib/mentor-access";
import { isMentorProfile, MentorFetchError } from "@/lib/mentors";

/** The mentors the caller may ask: the backend narrows a mentee in a program to that program's mentors. */
export async function fetchMentors(): Promise<MentorProfile[]> {
  try {
    const response = await backendHttp.get<unknown>("/api/mentors");
    if (response.status !== 200) {
      throw new MentorFetchError(`Mentor API returned HTTP ${response.status}`);
    }
    if (
      !Array.isArray(response.data) ||
      !response.data.every(isMentorProfile)
    ) {
      throw new MentorFetchError("Mentor API response has an invalid shape");
    }
    return response.data;
  } catch (error) {
    if (error instanceof MentorFetchError) throw error;
    throw new MentorFetchError("Mentor API request failed", error);
  }
}

async function fetchMentorById(
  mentorId: string,
): Promise<MentorProfile | null> {
  try {
    const response = await backendHttp.get<unknown>(
      `/api/mentors/${encodeURIComponent(mentorId)}`,
    );
    return response.status === 200 && isMentorProfile(response.data)
      ? response.data
      : null;
  } catch {
    return null;
  }
}

/** The caller's own programs; none for someone outside programs. */
async function viewerProgramIds(): Promise<string[]> {
  try {
    const response =
      await backendHttp.get<OrganizationPrograms>("/api/programs/mine");
    if (response.status !== 200) return [];
    return response.data.programs.map((program) => program.id);
  } catch {
    return [];
  }
}

export type MentorPage = {
  mentor: MentorProfile;
  /** Shared programs when the profile is view-only; null when the viewer may send a request. */
  viewOnlyPrograms: string[] | null;
};

/** The mentor a profile page shows, or null when the viewer may not see them. */
export async function loadMentorPage(
  mentorId: string,
): Promise<MentorPage | null> {
  const mentors = await fetchMentors().catch(() => []);
  const reachable = mentors.find((item) => item.id === mentorId);
  if (reachable) return { mentor: reachable, viewOnlyPrograms: null };

  const [mentor, programIds] = await Promise.all([
    fetchMentorById(mentorId),
    viewerProgramIds(),
  ]);
  if (
    !mentor ||
    mentorPageAccess({
      reachable: false,
      mentor,
      viewerProgramIds: programIds,
    }) !== MentorPageAccess.ViewOnly
  ) {
    return null;
  }
  return {
    mentor,
    viewOnlyPrograms: sharedProgramNames(mentor, programIds),
  };
}

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

/** The mentor's open times; none when they cannot be read. */
export async function loadMentorSlots(
  mentorId: string,
): Promise<MentorAvailabilitySlot[]> {
  try {
    const response = await backendHttp.get<unknown>(
      `/api/mentors/${encodeURIComponent(mentorId)}/availability`,
    );
    if (response.status !== 200 || !Array.isArray(response.data)) return [];
    return response.data.filter(isAvailabilitySlot);
  } catch {
    return [];
  }
}
