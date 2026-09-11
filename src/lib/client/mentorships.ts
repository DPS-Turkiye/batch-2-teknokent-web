import type {
  MentorshipGoal,
  MentorshipWeekCheck,
  OrganizationSummary,
  RegularMentorship,
} from "@/interfaces/regular-mentorship";
import { UserRole } from "@/interfaces/session";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getRegularMentorships(
  role: UserRole.Mentee | UserRole.Mentor = UserRole.Mentee,
) {
  return requireSuccess(
    await httpClient.get<RegularMentorship[]>("/api/mentorships", {
      params: role === UserRole.Mentor ? { role } : undefined,
    }),
  );
}

export async function getRegularMentorship(id: string) {
  return requireSuccess(
    await httpClient.get<RegularMentorship>(
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
    await httpClient.post<RegularMentorship>("/api/mentorships", input),
  );
}

export async function updateRegularMentorship(options: {
  mentorshipId: string;
  startDate: string;
  endDate: string | null;
  daysPerWeek: number;
}) {
  return requireSuccess(
    await httpClient.patch<RegularMentorship>(
      `/api/mentorships/${encodeURIComponent(options.mentorshipId)}`,
      {
        startDate: options.startDate,
        endDate: options.endDate,
        daysPerWeek: options.daysPerWeek,
      },
    ),
  );
}

export async function deleteRegularMentorship(mentorshipId: string) {
  return requireSuccess(
    await httpClient.delete(
      `/api/mentorships/${encodeURIComponent(mentorshipId)}`,
    ),
  );
}

export async function addRegularMentorshipGoal(options: {
  mentorshipId: string;
  title: string;
}) {
  return requireSuccess(
    await httpClient.post<MentorshipGoal>(
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
    await httpClient.patch<MentorshipGoal>(
      `/api/mentorships/${encodeURIComponent(options.mentorshipId)}/goals/${encodeURIComponent(options.goalId)}`,
      { done: options.done },
    ),
  );
}

export async function getMentorshipWeekChecks(weekStart: string) {
  return requireSuccess(
    await httpClient.get<MentorshipWeekCheck[]>(
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
    await httpClient.put<MentorshipWeekCheck>(
      `/api/mentorships/${encodeURIComponent(options.mentorshipId)}/week-checks`,
      {
        weekStart: options.weekStart,
        completed: options.completed,
      },
    ),
  );
}

export async function searchOrganizations() {
  return requireSuccess(
    await httpClient.get<OrganizationSummary[]>(
      "/api/mentorships/organizations",
    ),
  );
}
