import type {
  PlatformFeedback,
  PlatformFeedbackInbox,
  SubmitPlatformFeedback,
} from "@/interfaces/platform-feedback";
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
) {
  return requireSuccess(
    await httpClient.get<PlatformFeedbackInbox>(
      "/api/admin/platform-feedback",
      { params: { page, unreadOnly } },
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
