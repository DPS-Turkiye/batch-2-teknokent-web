import type {
  MentorLabelBoard,
  MentorLabelDirectory,
  MentorLabelInput,
  MentorProgramLabels,
} from "@/interfaces/mentor-label";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";
import { normalizeMentorLabelName } from "@/lib/mentor-labels";

/** The name goes as the backend saves it, so a label the board already has is recognised as the same. */
function labelBody(input: MentorLabelInput): MentorLabelInput {
  return { ...input, name: normalizeMentorLabelName(input.name) };
}

const boardUrl = (programId: string) =>
  `/api/coordinator/programs/${encodeURIComponent(programId)}/mentor-labels`;

export async function getMentorLabelBoard(programId: string) {
  return requireSuccess(
    await backendHttp.get<MentorLabelBoard>(boardUrl(programId)),
  );
}

export async function createMentorLabel(
  programId: string,
  input: MentorLabelInput,
) {
  return requireSuccess(
    await backendHttp.post<MentorLabelBoard>(
      boardUrl(programId),
      labelBody(input),
    ),
  );
}

export async function updateMentorLabel(
  programId: string,
  labelId: string,
  input: MentorLabelInput,
) {
  return requireSuccess(
    await backendHttp.put<MentorLabelBoard>(
      `${boardUrl(programId)}/${encodeURIComponent(labelId)}`,
      labelBody(input),
    ),
  );
}

export async function deleteMentorLabel(programId: string, labelId: string) {
  return requireSuccess(
    await backendHttp.delete<MentorLabelBoard>(
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
    await backendHttp.put<MentorLabelBoard>(
      `/api/coordinator/programs/${encodeURIComponent(programId)}/mentors/${encodeURIComponent(mentorId)}/labels`,
      { labelIds },
    ),
  );
}

export async function getMentorLabelDirectory() {
  return requireSuccess(
    await backendHttp.get<MentorLabelDirectory>("/api/mentor-labels/directory"),
  );
}

export async function getMentorProgramLabels(mentorId: string) {
  return requireSuccess(
    await backendHttp.get<MentorProgramLabels[]>(
      `/api/mentor-labels/mentors/${encodeURIComponent(mentorId)}`,
    ),
  );
}
