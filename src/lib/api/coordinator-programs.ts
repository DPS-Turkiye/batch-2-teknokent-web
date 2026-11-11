import "server-only";

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
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

export function fetchCoordinatorPrograms(actorId: string) {
  return backendRequest<CoordinatorProgram[]>({
    method: "GET",
    url: "/api/coordinator/programs",
    params: { actorId },
  });
}

export function createCoordinatorProgramEvent(
  actorId: string,
  programId: string,
  input: CreateProgramEventInput,
) {
  return backendRequest<ProgramEvent>({
    method: "POST",
    url: `/api/coordinator/programs/${encodeURIComponent(programId)}/events`,
    data: { ...input, actorId },
  });
}

const programUrl = (programId: string) =>
  `/api/coordinator/programs/${encodeURIComponent(programId)}`;

export function fetchCoordinatorProgram(actorId: string, programId: string) {
  return backendRequest<CoordinatorProgramDetail>({
    method: "GET",
    url: programUrl(programId),
    params: { actorId },
  });
}

export function updateCoordinatorProgram(
  actorId: string,
  programId: string,
  input: UpdateProgramDetailsInput,
) {
  return backendRequest<CoordinatorProgramDetail>({
    method: "PUT",
    url: programUrl(programId),
    data: { ...input, actorId },
  });
}

export function replaceCoordinatorProgramPhases(
  actorId: string,
  programId: string,
  phases: ProgramPhaseInput[],
  syllabusDocumentId: string | null = null,
) {
  return backendRequest<CoordinatorProgramDetail>({
    method: "PUT",
    url: `${programUrl(programId)}/phases`,
    data: { actorId, phases, syllabusDocumentId },
  });
}

export function extractSyllabusPhases(
  actorId: string,
  input: ExtractSyllabusPhasesInput,
) {
  return backendRequest<SyllabusPhases>({
    method: "POST",
    url: "/api/coordinator/programs/syllabus/phases",
    data: { ...input, actorId },
  });
}

export function launchCoordinatorProgram(actorId: string, programId: string) {
  return backendRequest<CoordinatorProgramDetail>({
    method: HttpMethod.Post,
    url: `${programUrl(programId)}/launch`,
    params: { actorId },
  });
}

export function setCoordinatorProgramArchived(
  actorId: string,
  programId: string,
  archived: boolean,
) {
  return backendRequest<CoordinatorProgramDetail>({
    method: "PUT",
    url: `${programUrl(programId)}/archive`,
    data: { actorId, archived },
  });
}

export function fetchProgramCoordinators(
  actorId: string,
  programId: string,
  candidates = false,
) {
  return backendRequest<CoordinatorRef[]>({
    method: "GET",
    url: `${programUrl(programId)}/coordinators${candidates ? "/candidates" : ""}`,
    params: { actorId },
  });
}

export function addProgramCoordinator(
  actorId: string,
  programId: string,
  userId: string,
) {
  return backendRequest<CoordinatorRef[]>({
    method: "POST",
    url: `${programUrl(programId)}/coordinators`,
    data: { actorId, userId },
  });
}

export function removeProgramCoordinator(
  actorId: string,
  programId: string,
  userId: string,
) {
  return backendRequest<CoordinatorRef[]>({
    method: "DELETE",
    url: `${programUrl(programId)}/coordinators/${encodeURIComponent(userId)}`,
    params: { actorId },
  });
}

export function fetchProgramEligibleEmails(actorId: string, programId: string) {
  return backendRequest<ProgramEligibleEmail[]>({
    method: "GET",
    url: `${programUrl(programId)}/eligible-emails`,
    params: { actorId },
  });
}

export function addProgramEligibleEmails(
  actorId: string,
  programId: string,
  emails: string[],
) {
  return backendRequest<ProgramEligibleEmail[]>({
    method: "POST",
    url: `${programUrl(programId)}/eligible-emails`,
    data: { actorId, emails },
  });
}

export function removeProgramEligibleEmail(
  actorId: string,
  programId: string,
  entryId: string,
) {
  return backendRequest<ProgramEligibleEmail[]>({
    method: "DELETE",
    url: `${programUrl(programId)}/eligible-emails/${encodeURIComponent(entryId)}`,
    params: { actorId },
  });
}

export function createCoordinatorProgram(
  actorId: string,
  input: CreateProgramInput,
) {
  return backendRequest<CoordinatorProgramDetail>({
    method: "POST",
    url: "/api/coordinator/programs",
    data: { ...input, actorId },
  });
}

export function fetchProgramTeams(actorId: string, programId: string) {
  return backendRequest<ProgramTeam[]>({
    method: "GET",
    url: `${programUrl(programId)}/teams`,
    params: { actorId },
  });
}

export function addProgramTeams(
  actorId: string,
  programId: string,
  teams: TeamInviteInput[],
) {
  return backendRequest<ProgramTeam[]>({
    method: "POST",
    url: `${programUrl(programId)}/teams`,
    data: { actorId, teams },
  });
}

export function updateProgramTeam(
  actorId: string,
  programId: string,
  inviteId: string,
  input: TeamInviteInput,
) {
  return backendRequest<ProgramTeam[]>({
    method: "PUT",
    url: `${programUrl(programId)}/teams/${encodeURIComponent(inviteId)}`,
    params: { actorId },
    data: input,
  });
}

export function removeProgramTeam(
  actorId: string,
  programId: string,
  inviteId: string,
) {
  return backendRequest<ProgramTeam[]>({
    method: "DELETE",
    url: `${programUrl(programId)}/teams/${encodeURIComponent(inviteId)}`,
    params: { actorId },
  });
}

export function sendProgramTeamCode(
  actorId: string,
  programId: string,
  inviteId: string,
) {
  return backendRequest<ProgramTeam[]>({
    method: "POST",
    url: `${programUrl(programId)}/teams/${encodeURIComponent(inviteId)}/send-code`,
    params: { actorId },
  });
}

export function fetchProgramTeamDetail(
  actorId: string,
  programId: string,
  organizationId: string,
) {
  return backendRequest<ProgramTeamDetail>({
    method: "GET",
    url: `${programUrl(programId)}/team-details/${encodeURIComponent(organizationId)}`,
    params: { actorId },
  });
}

export function fetchMentorPool(actorId: string, programId: string) {
  return backendRequest<MentorPoolRow[]>({
    method: "GET",
    url: `${programUrl(programId)}/mentors`,
    params: { actorId },
  });
}

export function inviteProgramMentor(
  actorId: string,
  programId: string,
  email: string,
) {
  return backendRequest<MentorPoolRow[]>({
    method: "POST",
    url: `${programUrl(programId)}/mentors`,
    data: { actorId, email },
  });
}

export function withdrawProgramMentorInvite(
  actorId: string,
  programId: string,
  mentorId: string,
) {
  return backendRequest<MentorPoolRow[]>({
    method: "DELETE",
    url: `${programUrl(programId)}/mentors/${encodeURIComponent(mentorId)}`,
    params: { actorId },
  });
}

export function fetchMentorReview(
  actorId: string,
  programId: string,
  mentorId: string,
) {
  return backendRequest<MentorPoolReview>({
    method: "GET",
    url: `${programUrl(programId)}/mentors/${encodeURIComponent(mentorId)}/review`,
    params: { actorId },
  });
}

export function decideProgramMentor(
  actorId: string,
  programId: string,
  mentorId: string,
  accepted: boolean,
) {
  return backendRequest<MentorPoolRow[]>({
    method: "POST",
    url: `${programUrl(programId)}/mentors/${encodeURIComponent(mentorId)}/decision`,
    data: { actorId, accepted },
  });
}

export function fetchProgramApprovals(actorId: string, programId: string) {
  return backendRequest<ProgramApprovals>({
    method: HttpMethod.Get,
    url: `${programUrl(programId)}/approvals`,
    params: { actorId },
  });
}

export function decideProgramApproval(
  actorId: string,
  programId: string,
  kind: ApprovalKind,
  id: string,
  accepted: boolean,
) {
  return backendRequest<ProgramApprovals>({
    method: HttpMethod.Post,
    url: `${programUrl(programId)}/approvals/${kind}/${encodeURIComponent(id)}`,
    data: { actorId, accepted },
  });
}

export function fetchProgramWithoutTeam(actorId: string, programId: string) {
  return backendRequest<ProgramApprovalPerson[]>({
    method: HttpMethod.Get,
    url: `${programUrl(programId)}/without-team`,
    params: { actorId },
  });
}

export function renewMentorInvite(
  actorId: string,
  programId: string,
  inviteId: string,
) {
  return backendRequest<MentorPoolRow[]>({
    method: "POST",
    url: `${programUrl(programId)}/mentor-invites/${encodeURIComponent(inviteId)}/renew`,
    params: { actorId },
  });
}

export function cancelMentorInvite(
  actorId: string,
  programId: string,
  inviteId: string,
) {
  return backendRequest<MentorPoolRow[]>({
    method: "DELETE",
    url: `${programUrl(programId)}/mentor-invites/${encodeURIComponent(inviteId)}`,
    params: { actorId },
  });
}

export function fetchMatching(actorId: string, programId: string) {
  return backendRequest<MatchingOverview>({
    method: "GET",
    url: `${programUrl(programId)}/matching`,
    params: { actorId },
  });
}

export function fetchMatchSuggestions(
  actorId: string,
  programId: string,
  organizationId: string,
) {
  return backendRequest<MatchSuggestions>({
    method: "GET",
    url: `${programUrl(programId)}/matching/${encodeURIComponent(organizationId)}/suggestions`,
    params: { actorId },
  });
}

export function createMatch(
  actorId: string,
  programId: string,
  input: { organizationId: string; mentorId: string },
) {
  return backendRequest<MatchingOverview>({
    method: "POST",
    url: `${programUrl(programId)}/matching`,
    data: { ...input, actorId },
  });
}
