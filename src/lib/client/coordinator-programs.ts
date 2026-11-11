import type { NewCoordinatorInput } from "@/interfaces/admin-coordinator";
import type {
  CoordinatorProgram,
  CoordinatorProgramDetail,
  CoordinatorRef,
  CreateProgramEventInput,
  CreateProgramInput,
  ExtractSyllabusPhasesInput,
  ProgramEligibleEmail,
  ProgramEvent,
  ProgramPhaseInput,
  ProgramTeam,
  ProgramTeamDetail,
  SyllabusPhases,
  TeamInviteInput,
  UpdateProgramDetailsInput,
} from "@/interfaces/coordinator-program";
import type { MentorPoolReview, MentorPoolRow } from "@/interfaces/mentor-pool";
import type {
  ApprovalKind,
  ProgramApprovalPerson,
  ProgramApprovals,
} from "@/interfaces/program-approvals";
import type {
  MatchingOverview,
  MatchSuggestions,
} from "@/interfaces/program-matching";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getCoordinatorPrograms() {
  return requireSuccess(
    await httpClient.get<CoordinatorProgram[]>("/api/coordinator/programs"),
  );
}

export async function createCoordinatorProgramEvent(
  programId: string,
  input: CreateProgramEventInput,
) {
  return requireSuccess(
    await httpClient.post<ProgramEvent>(
      `/api/coordinator/programs/${encodeURIComponent(programId)}/events`,
      input,
    ),
  );
}

const programUrl = (programId: string) =>
  `/api/coordinator/programs/${encodeURIComponent(programId)}`;

export async function getCoordinatorProgram(programId: string) {
  return requireSuccess(
    await httpClient.get<CoordinatorProgramDetail>(programUrl(programId)),
  );
}

export async function updateCoordinatorProgram(
  programId: string,
  input: UpdateProgramDetailsInput,
) {
  return requireSuccess(
    await httpClient.put<CoordinatorProgramDetail>(
      programUrl(programId),
      input,
    ),
  );
}

export async function replaceCoordinatorProgramPhases(
  programId: string,
  phases: ProgramPhaseInput[],
  syllabusDocumentId: string | null = null,
) {
  return requireSuccess(
    await httpClient.put<CoordinatorProgramDetail>(
      `${programUrl(programId)}/phases`,
      { phases, syllabusDocumentId },
    ),
  );
}

export async function extractSyllabusPhases(input: ExtractSyllabusPhasesInput) {
  return requireSuccess(
    await httpClient.post<SyllabusPhases>(
      "/api/coordinator/programs/syllabus/phases",
      input,
    ),
  );
}

export async function launchCoordinatorProgram(programId: string) {
  return requireSuccess(
    await httpClient.post<CoordinatorProgramDetail>(
      `${programUrl(programId)}/launch`,
      {},
    ),
  );
}

export async function setCoordinatorProgramArchived(
  programId: string,
  archived: boolean,
) {
  return requireSuccess(
    await httpClient.put<CoordinatorProgramDetail>(
      `${programUrl(programId)}/archive`,
      { archived },
    ),
  );
}

export async function getProgramCoordinators(programId: string) {
  return requireSuccess(
    await httpClient.get<CoordinatorRef[]>(
      `${programUrl(programId)}/coordinators`,
    ),
  );
}

export async function addProgramCoordinator(programId: string, userId: string) {
  return requireSuccess(
    await httpClient.post<CoordinatorRef[]>(
      `${programUrl(programId)}/coordinators`,
      { userId },
    ),
  );
}

export async function inviteProgramCoordinator(
  programId: string,
  invite: NewCoordinatorInput,
) {
  return requireSuccess(
    await httpClient.post<CoordinatorRef[]>(
      `${programUrl(programId)}/coordinators`,
      { invite },
    ),
  );
}

export async function removeProgramCoordinator(
  programId: string,
  userId: string,
) {
  return requireSuccess(
    await httpClient.delete<CoordinatorRef[]>(
      `${programUrl(programId)}/coordinators/${encodeURIComponent(userId)}`,
    ),
  );
}

export async function getProgramEligibleEmails(programId: string) {
  return requireSuccess(
    await httpClient.get<ProgramEligibleEmail[]>(
      `${programUrl(programId)}/eligible-emails`,
    ),
  );
}

export async function addProgramEligibleEmails(
  programId: string,
  emails: string[],
) {
  return requireSuccess(
    await httpClient.post<ProgramEligibleEmail[]>(
      `${programUrl(programId)}/eligible-emails`,
      { emails },
    ),
  );
}

export async function removeProgramEligibleEmail(
  programId: string,
  entryId: string,
) {
  return requireSuccess(
    await httpClient.delete<ProgramEligibleEmail[]>(
      `${programUrl(programId)}/eligible-emails/${encodeURIComponent(entryId)}`,
    ),
  );
}

export async function createCoordinatorProgram(input: CreateProgramInput) {
  return requireSuccess(
    await httpClient.post<CoordinatorProgramDetail>(
      "/api/coordinator/programs",
      input,
    ),
  );
}

export async function getProgramTeams(programId: string) {
  return requireSuccess(
    await httpClient.get<ProgramTeam[]>(`${programUrl(programId)}/teams`),
  );
}

export async function addProgramTeams(
  programId: string,
  teams: TeamInviteInput[],
) {
  return requireSuccess(
    await httpClient.post<ProgramTeam[]>(`${programUrl(programId)}/teams`, {
      teams,
    }),
  );
}

export async function updateProgramTeam(
  programId: string,
  inviteId: string,
  input: TeamInviteInput,
) {
  return requireSuccess(
    await httpClient.put<ProgramTeam[]>(
      `${programUrl(programId)}/teams/${encodeURIComponent(inviteId)}`,
      input,
    ),
  );
}

export async function removeProgramTeam(programId: string, inviteId: string) {
  return requireSuccess(
    await httpClient.delete<ProgramTeam[]>(
      `${programUrl(programId)}/teams/${encodeURIComponent(inviteId)}`,
    ),
  );
}

export async function sendProgramTeamCode(programId: string, inviteId: string) {
  return requireSuccess(
    await httpClient.post<ProgramTeam[]>(
      `${programUrl(programId)}/teams/${encodeURIComponent(inviteId)}/send-code`,
    ),
  );
}

export async function getProgramTeamDetail(
  programId: string,
  organizationId: string,
) {
  return requireSuccess(
    await httpClient.get<ProgramTeamDetail>(
      `${programUrl(programId)}/team-details/${encodeURIComponent(organizationId)}`,
    ),
  );
}

export async function getProgramApprovals(programId: string) {
  return requireSuccess(
    await httpClient.get<ProgramApprovals>(
      `${programUrl(programId)}/approvals`,
    ),
  );
}

export async function decideProgramApproval(
  programId: string,
  kind: ApprovalKind,
  id: string,
  accepted: boolean,
) {
  return requireSuccess(
    await httpClient.post<ProgramApprovals>(
      `${programUrl(programId)}/approvals/${kind}/${encodeURIComponent(id)}`,
      { accepted },
    ),
  );
}

export async function getProgramWithoutTeam(programId: string) {
  return requireSuccess(
    await httpClient.get<ProgramApprovalPerson[]>(
      `${programUrl(programId)}/without-team`,
    ),
  );
}

const mentorUrl = (programId: string, mentorId: string) =>
  `${programUrl(programId)}/mentors/${encodeURIComponent(mentorId)}`;
const mentorInviteUrl = (programId: string, inviteId: string) =>
  `${programUrl(programId)}/mentor-invites/${encodeURIComponent(inviteId)}`;

export async function getMentorPool(programId: string) {
  return requireSuccess(
    await httpClient.get<MentorPoolRow[]>(`${programUrl(programId)}/mentors`),
  );
}

export async function inviteProgramMentor(programId: string, email: string) {
  return requireSuccess(
    await httpClient.post<MentorPoolRow[]>(`${programUrl(programId)}/mentors`, {
      email,
    }),
  );
}

export async function withdrawProgramMentorInvite(
  programId: string,
  mentorId: string,
) {
  return requireSuccess(
    await httpClient.delete<MentorPoolRow[]>(mentorUrl(programId, mentorId)),
  );
}

export async function getMentorReview(programId: string, mentorId: string) {
  return requireSuccess(
    await httpClient.get<MentorPoolReview>(
      `${mentorUrl(programId, mentorId)}/review`,
    ),
  );
}

export async function decideProgramMentor(
  programId: string,
  mentorId: string,
  accepted: boolean,
) {
  return requireSuccess(
    await httpClient.post<MentorPoolRow[]>(
      `${mentorUrl(programId, mentorId)}/decision`,
      { accepted },
    ),
  );
}

export async function renewMentorInvite(programId: string, inviteId: string) {
  return requireSuccess(
    await httpClient.post<MentorPoolRow[]>(
      `${mentorInviteUrl(programId, inviteId)}/renew`,
      {},
    ),
  );
}

export async function cancelMentorInvite(programId: string, inviteId: string) {
  return requireSuccess(
    await httpClient.delete<MentorPoolRow[]>(
      mentorInviteUrl(programId, inviteId),
    ),
  );
}

export async function getMatching(programId: string) {
  return requireSuccess(
    await httpClient.get<MatchingOverview>(`${programUrl(programId)}/matching`),
  );
}

export async function getMatchSuggestions(
  programId: string,
  organizationId: string,
) {
  return requireSuccess(
    await httpClient.get<MatchSuggestions>(
      `${programUrl(programId)}/matching/${encodeURIComponent(organizationId)}/suggestions`,
    ),
  );
}

export async function createMatch(
  programId: string,
  input: { organizationId: string; mentorId: string },
) {
  return requireSuccess(
    await httpClient.post<MatchingOverview>(
      `${programUrl(programId)}/matching`,
      input,
    ),
  );
}
