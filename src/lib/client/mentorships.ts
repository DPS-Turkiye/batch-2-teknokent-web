import { MentorshipStatus } from "@/interfaces/coordinator-mentorship";
import type {
  MentorshipGoal,
  MentorshipWeekCheck,
  OrganizationSummary,
  RegularMentorship,
} from "@/interfaces/regular-mentorship";
import { UserRole } from "@/interfaces/session";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp, signedInUserId } from "@/lib/client/backend-http";

/** The running mentorships of the caller as a mentor, or of their team (the backend takes it from the session). */
export async function getRegularMentorships(
  role: UserRole.Mentee | UserRole.Mentor = UserRole.Mentee,
) {
  const params =
    role === UserRole.Mentor
      ? { activeOnly: true, mentorId: await signedInUserId() }
      : { activeOnly: true };
  return requireSuccess(
    await backendHttp.get<RegularMentorship[]>("/api/mentorships", { params }),
  );
}

export async function getRegularMentorship(id: string) {
  return requireSuccess(
    await backendHttp.get<RegularMentorship>(
      `/api/mentorships/${encodeURIComponent(id)}`,
    ),
  );
}

export async function startRegularMentorship(input: {
  organizationId: string;
  startDate: string;
  endDate: string;
  daysPerWeek: number;
}) {
  return requireSuccess(
    await backendHttp.post<RegularMentorship>("/api/mentorships", {
      ...input,
      status: MentorshipStatus.Active,
      daysPerWeek: Math.min(7, Math.max(1, input.daysPerWeek)),
    }),
  );
}

export async function updateRegularMentorship(options: {
  mentorshipId: string;
  startDate: string;
  endDate: string | null;
  daysPerWeek: number;
}) {
  return requireSuccess(
    await backendHttp.patch<RegularMentorship>(
      `/api/mentorships/${encodeURIComponent(options.mentorshipId)}`,
      {
        startDate: options.startDate,
        endDate: options.endDate,
        daysPerWeek: Math.min(7, Math.max(1, options.daysPerWeek)),
      },
    ),
  );
}

export async function deleteRegularMentorship(mentorshipId: string) {
  requireSuccess(
    await backendHttp.delete<void>(
      `/api/mentorships/${encodeURIComponent(mentorshipId)}`,
    ),
  );
}

export async function addRegularMentorshipGoal(options: {
  mentorshipId: string;
  title: string;
}) {
  return requireSuccess(
    await backendHttp.post<MentorshipGoal>(
      `/api/mentorships/${encodeURIComponent(options.mentorshipId)}/goals`,
      { title: options.title },
    ),
  );
}

export async function setRegularMentorshipGoalDone(options: {
  mentorshipId: string;
  goalId: string;
  done: boolean;
}) {
  return requireSuccess(
    await backendHttp.patch<MentorshipGoal>(
      `/api/mentorships/${encodeURIComponent(options.mentorshipId)}/goals/${encodeURIComponent(options.goalId)}`,
      { done: options.done },
    ),
  );
}

export async function getMentorshipWeekChecks(weekStart: string) {
  return requireSuccess(
    await backendHttp.get<MentorshipWeekCheck[]>(
      "/api/mentorships/week-checks",
      { params: { weekStart } },
    ),
  );
}

export async function setMentorshipWeekCheck(options: {
  mentorshipId: string;
  weekStart: string;
  completed: boolean;
}) {
  return requireSuccess(
    await backendHttp.put<MentorshipWeekCheck>(
      `/api/mentorships/${encodeURIComponent(options.mentorshipId)}/week-checks`,
      {
        weekStart: options.weekStart,
        completed: options.completed,
      },
    ),
  );
}

/** The startups a mentor can start a regular mentorship with, by name only. */
export async function searchOrganizations(): Promise<OrganizationSummary[]> {
  const organizations = requireSuccess(
    await backendHttp.get<OrganizationSummary[]>("/api/organizations"),
  );
  return organizations.map(({ id, name }) => ({ id, name }));
}
