import "server-only";

import type {
  MentorLabelBoard,
  MentorLabelDirectory,
  MentorLabelInput,
  MentorProgramLabels,
} from "@/interfaces/mentor-label";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

const boardUrl = (programId: string) =>
  `/api/coordinator/programs/${encodeURIComponent(programId)}/mentor-labels`;

export function fetchMentorLabelBoard(actorId: string, programId: string) {
  return backendRequest<MentorLabelBoard>({
    method: HttpMethod.Get,
    url: boardUrl(programId),
    params: { actorId },
  });
}

export function createMentorLabel(
  actorId: string,
  programId: string,
  input: MentorLabelInput,
) {
  return backendRequest<MentorLabelBoard>({
    method: HttpMethod.Post,
    url: boardUrl(programId),
    data: { actorId, ...input },
  });
}

export function updateMentorLabel(
  actorId: string,
  programId: string,
  labelId: string,
  input: MentorLabelInput,
) {
  return backendRequest<MentorLabelBoard>({
    method: HttpMethod.Put,
    url: `${boardUrl(programId)}/${encodeURIComponent(labelId)}`,
    data: { actorId, ...input },
  });
}

export function deleteMentorLabel(
  actorId: string,
  programId: string,
  labelId: string,
) {
  return backendRequest<MentorLabelBoard>({
    method: HttpMethod.Delete,
    url: `${boardUrl(programId)}/${encodeURIComponent(labelId)}`,
    params: { actorId },
  });
}

export function setMentorLabels(
  actorId: string,
  programId: string,
  mentorId: string,
  labelIds: string[],
) {
  return backendRequest<MentorLabelBoard>({
    method: HttpMethod.Put,
    url: `/api/coordinator/programs/${encodeURIComponent(programId)}/mentors/${encodeURIComponent(mentorId)}/labels`,
    data: { actorId, labelIds },
  });
}

export function fetchMentorLabelDirectory(actorId: string) {
  return backendRequest<MentorLabelDirectory>({
    method: HttpMethod.Get,
    url: "/api/mentor-labels/directory",
    params: { actorId },
  });
}

export function fetchMentorProgramLabels(actorId: string, mentorId: string) {
  return backendRequest<MentorProgramLabels[]>({
    method: HttpMethod.Get,
    url: `/api/mentor-labels/mentors/${encodeURIComponent(mentorId)}`,
    params: { actorId },
  });
}
