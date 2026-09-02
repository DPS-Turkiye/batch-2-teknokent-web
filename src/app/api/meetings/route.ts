import { NextResponse, type NextRequest } from "next/server";

import { ProgramMentorStatus, type Program } from "@/interfaces/program";
import { UserRole } from "@/interfaces/session";
import { createMeeting, fetchMeetings } from "@/lib/api/meetings";
import { fetchMentorRequest } from "@/lib/api/mentor-requests";
import { fetchPrograms } from "@/lib/api/programs";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds, getSessionUser } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (session?.role === UserRole.Mentor) {
      return backendResponse(await fetchMeetings({ mentorId: session.userId }));
    }
    const { organizationId } = await getSessionIds();
    return backendResponse(await fetchMeetings({ organizationId }));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Meeting service is unavailable.",
    });
  }
}

async function resolveMentorMeetingOrganization(
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

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    const payload = (await request.json()) as Record<string, unknown>;
    const isMentor = session?.role === UserRole.Mentor;
    const mentorId = isMentor ? session.userId : undefined;

    // A mentor has no organization of their own, so the meeting's organization
    // is resolved from the mentorship or program startup - server-side, so a
    // caller cannot book a meeting into somebody else's organization.
    let organizationId: string;
    let otherMentorIds: string[] = [];
    if (isMentor) {
      const resolved = await resolveMentorMeetingOrganization(
        payload,
        session.userId,
      );
      if ("error" in resolved) return resolved.error;
      organizationId = resolved.organizationId;
      otherMentorIds = resolved.otherMentorIds;
    } else {
      ({ organizationId } = await getSessionIds());
    }

    const created = await createMeeting(organizationId, payload, mentorId);
    for (const otherMentorId of otherMentorIds) {
      await createMeeting(organizationId, payload, otherMentorId);
    }
    return backendResponse(created);
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Meeting could not be created.",
    });
  }
}
