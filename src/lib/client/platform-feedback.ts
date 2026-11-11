import type {
  PlatformFeedback,
  PlatformFeedbackInbox,
  SubmitPlatformFeedback,
} from "@/interfaces/platform-feedback";
import type { ProgramType } from "@/interfaces/program";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function submitPlatformFeedback(feedback: SubmitPlatformFeedback) {
  return requireSuccess(
    await httpClient.post<PlatformFeedback>("/api/platform-feedback", feedback),
  );
}

export async function getPlatformFeedbackInbox(
  page: number,
  unreadOnly: boolean,
  programType: ProgramType | null = null,
) {
  return requireSuccess(
    await httpClient.get<PlatformFeedbackInbox>(
      "/api/admin/platform-feedback",
      {
        params: programType
          ? { page, unreadOnly, programType }
          : { page, unreadOnly },
      },
    ),
  );
}

export async function readPlatformFeedback(id: string) {
  return requireSuccess(
    await httpClient.patch<PlatformFeedback>(
      `/api/admin/platform-feedback/${encodeURIComponent(id)}/read`,
    ),
  );
}
