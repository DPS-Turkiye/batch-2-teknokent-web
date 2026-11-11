import { NextResponse } from "next/server";

import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { ProgramMentorStatus, type Program } from "@/interfaces/program";
import type { RegularMentorship } from "@/interfaces/regular-mentorship";
import { UserRole, type AppSession } from "@/interfaces/session";
import { fetchMeetings } from "@/lib/api/meetings";
import {
  fetchMentorRequest,
  fetchMentorRequests,
} from "@/lib/api/mentor-requests";
import { fetchRegularMentorships } from "@/lib/api/mentorships";
import { fetchPrograms } from "@/lib/api/programs";
import { hasPermission } from "@/lib/permissions";
import { apiText, backendResponse } from "@/lib/server/api-response";

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
          message: await apiText("noActiveMentorship"),
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
          message: await apiText("meetingStartupRequired"),
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
          message: await apiText("notInProgram"),
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
          message: await apiText("startupNotInProgram"),
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

export function requireOwnedMeeting(mentorId: string, meetingId: string) {
  return findMeetingIn({ mentorId }, meetingId);
}

/** The caller's own meeting: a mentor's, or one of a startup member's startup. */
export async function requireMeetingAccess(
  session: AppSession,
  meetingId: string,
) {
  // By relation, not role: an account that mentors and is on a team reaches its own meetings on both sides.
  const mentorSide = hasPermission(session, UserRole.Mentor);
  const teamSide =
    hasPermission(session, UserRole.Mentee) && Boolean(session.organizationId);
  if (mentorSide) {
    const own = await findMeetingIn({ mentorId: session.userId }, meetingId);
    if (!("error" in own) || !teamSide) return own;
  }
  if (teamSide) {
    return findMeetingIn({ organizationId: session.organizationId }, meetingId);
  }
  return {
    error: NextResponse.json(
      { code: "FORBIDDEN", message: await apiText("meetingNotEditable") },
      { status: 403 },
    ),
  };
}

async function findMeetingIn(
  scope: { mentorId?: string | undefined; organizationId?: string | undefined },
  meetingId: string,
) {
  const list = await fetchMeetings(scope);
  if (list.status !== 200) return { error: backendResponse(list) };
  const owned = ((list.data ?? []) as { id: string }[]).find(
    (item) => item.id === meetingId,
  );
  if (!owned) {
    return {
      error: NextResponse.json(
        { code: "NOT_FOUND", message: await apiText("meetingNotFound") },
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
          message: await apiText("mentorToAddRequired"),
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
          message: await apiText("noSharedProgram"),
        },
        { status: 403 },
      ),
    };
  }
  return { guestId };
}
