import { NextResponse } from "next/server";

import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { ProgramMentorStatus, type Program } from "@/interfaces/program";
import type { RegularMentorship } from "@/interfaces/regular-mentorship";
import { fetchMeetings } from "@/lib/api/meetings";
import {
  fetchMentorRequest,
  fetchMentorRequests,
} from "@/lib/api/mentor-requests";
import { fetchRegularMentorships } from "@/lib/api/mentorships";
import { fetchPrograms } from "@/lib/api/programs";
import { backendResponse } from "@/lib/server/api-response";
import { UserRole } from "@/interfaces/session";

export async function resolveMentorMeetingOrganization(
  payload: Record<string, unknown>,
  mentorId: string,
) {
  const requestId = payload.mentorshipRequestId;
  if (typeof requestId === "string" && requestId) {
    const mentorship = await fetchMentorRequest(requestId, mentorId);
    if (mentorship.status !== 200) {
      return { error: backendResponse(mentorship) };
    }
    return {
      organizationId: (mentorship.data as { organizationId: string })
        .organizationId,
      otherMentorIds: [] as string[],
    };
  }

  const programId = payload.programId;
  const organizationId = payload.organizationId;

  if (
    typeof organizationId === "string" &&
    organizationId &&
    (typeof programId !== "string" || !programId)
  ) {
    const regular = await fetchRegularMentorships({ mentorId });
    if (regular.status === 200) {
      const ownsRegular = ((regular.data ?? []) as RegularMentorship[]).some(
        (item) => item.organizationId === organizationId,
      );
      if (ownsRegular) {
        return { organizationId, otherMentorIds: [] as string[] };
      }
    }

    const requests = await fetchMentorRequests({
      actorId: mentorId,
      requesterId: mentorId,
      role: UserRole.Mentor,
    });
    if (requests.status === 200) {
      const ownsAccepted = (
        (requests.data ?? []) as {
          organizationId: string;
          status: MentorshipRequestStatus;
        }[]
      ).some(
        (item) =>
          item.organizationId === organizationId &&
          item.status === MentorshipRequestStatus.Accepted,
      );
      if (ownsAccepted) {
        return { organizationId, otherMentorIds: [] as string[] };
      }
    }

    return {
      error: NextResponse.json(
        {
          code: "FORBIDDEN",
          message: "Bu startup ile aktif bir mentorlüğünüz yok.",
        },
        { status: 403 },
      ),
    };
  }

  if (
    typeof programId !== "string" ||
    !programId ||
    typeof organizationId !== "string" ||
    !organizationId
  ) {
    return {
      error: NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: "Toplantı için bir startup seçilmelidir.",
        },
        { status: 400 },
      ),
    };
  }

  const programs = await fetchPrograms(mentorId);
  if (programs.status !== 200) return { error: backendResponse(programs) };
  const program = (programs.data ?? []).find(
    (item: Program) => item.id === programId,
  );
  const joined = program?.mentors.some(
    (mentor) =>
      mentor.mentorId === mentorId &&
      mentor.status === ProgramMentorStatus.Accepted,
  );
  if (!program || !joined) {
    return {
      error: NextResponse.json(
        {
          code: "FORBIDDEN",
          message: "Bu programa katılmadınız.",
        },
        { status: 403 },
      ),
    };
  }
  if (!program.startups.some((startup) => startup.id === organizationId)) {
    return {
      error: NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: "Bu startup bu programda yok.",
        },
        { status: 400 },
      ),
    };
  }
  const otherMentorIds = program.mentors
    .filter(
      (mentor) =>
        mentor.mentorId !== mentorId &&
        mentor.status === ProgramMentorStatus.Accepted,
    )
    .map((mentor) => mentor.mentorId);
  return { organizationId, otherMentorIds };
}

export async function requireOwnedMeeting(mentorId: string, meetingId: string) {
  const list = await fetchMeetings({ mentorId });
  if (list.status !== 200) return { error: backendResponse(list) };
  const owned = ((list.data ?? []) as { id: string }[]).find(
    (item) => item.id === meetingId,
  );
  if (!owned) {
    return {
      error: NextResponse.json(
        { code: "NOT_FOUND", message: "Toplantı bulunamadı." },
        { status: 404 },
      ),
    };
  }
  return { meeting: owned };
}

export async function resolveGuestMentor(actorId: string, guestId: string) {
  if (!guestId || guestId === actorId) {
    return {
      error: NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: "Eklenecek bir mentör seçilmelidir.",
        },
        { status: 400 },
      ),
    };
  }
  const programs = await fetchPrograms(actorId);
  if (programs.status !== 200) return { error: backendResponse(programs) };
  const shared = (programs.data ?? []).some(
    (program: Program) =>
      program.mentors.some(
        (mentor) =>
          mentor.mentorId === actorId &&
          mentor.status === ProgramMentorStatus.Accepted,
      ) &&
      program.mentors.some(
        (mentor) =>
          mentor.mentorId === guestId &&
          mentor.status === ProgramMentorStatus.Accepted,
      ),
  );
  if (!shared) {
    return {
      error: NextResponse.json(
        {
          code: "FORBIDDEN",
          message: "Bu mentörle ortak bir programınız yok.",
        },
        { status: 403 },
      ),
    };
  }
  return { guestId };
}
