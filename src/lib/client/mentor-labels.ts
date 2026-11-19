import type {
  MentorLabelBoard,
  MentorLabelDirectory,
  MentorLabelInput,
  MentorProgramLabels,
} from "@/interfaces/mentor-label";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

const boardUrl = (programId: string) =>
  `/api/coordinator/programs/${encodeURIComponent(programId)}/mentor-labels`;

export async function getMentorLabelBoard(programId: string) {
  return requireSuccess(
    await httpClient.get<MentorLabelBoard>(boardUrl(programId)),
  );
}

export async function createMentorLabel(
  programId: string,
  input: MentorLabelInput,
) {
  return requireSuccess(
    await httpClient.post<MentorLabelBoard>(boardUrl(programId), input),
  );
}

export async function updateMentorLabel(
  programId: string,
  labelId: string,
  input: MentorLabelInput,
) {
  return requireSuccess(
    await httpClient.put<MentorLabelBoard>(
      `${boardUrl(programId)}/${encodeURIComponent(labelId)}`,
      input,
    ),
  );
}

export async function deleteMentorLabel(programId: string, labelId: string) {
  return requireSuccess(
    await httpClient.delete<MentorLabelBoard>(
      `${boardUrl(programId)}/${encodeURIComponent(labelId)}`,
    ),
  );
}

export async function setMentorLabels(
  programId: string,
  mentorId: string,
  labelIds: string[],
) {
  return requireSuccess(
    await httpClient.put<MentorLabelBoard>(
      `/api/coordinator/programs/${encodeURIComponent(programId)}/mentors/${encodeURIComponent(mentorId)}/labels`,
      { labelIds },
    ),
  );
}

export async function getMentorLabelDirectory() {
  return requireSuccess(
    await httpClient.get<MentorLabelDirectory>("/api/mentor-labels/directory"),
  );
}

export async function getMentorProgramLabels(mentorId: string) {
  return requireSuccess(
    await httpClient.get<MentorProgramLabels[]>(
      `/api/mentor-labels/mentors/${encodeURIComponent(mentorId)}`,
    ),
  );
}
