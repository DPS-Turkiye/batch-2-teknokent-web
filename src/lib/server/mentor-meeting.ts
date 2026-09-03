import { NextResponse } from "next/server";

import { ProgramMentorStatus, type Program } from "@/interfaces/program";
import { fetchMeetings } from "@/lib/api/meetings";
import { fetchMentorRequest } from "@/lib/api/mentor-requests";
import { fetchPrograms } from "@/lib/api/programs";
import { backendResponse } from "@/lib/server/api-response";

export async function resolveMentorMeetingOrganization(
  payload: Record<string, unknown>,
  mentorId: string,
) {
  const requestId = payload.mentorshipRequestId;
  if (typeof requestId === "string" && requestId) {
    const mentorship = await fetchMentorRequest(requestId);
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
