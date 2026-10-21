import { NextRequest } from "next/server";

import { createTranscriptUpload } from "@/lib/api/meeting-notes";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireMentorSession } from "@/lib/server/require-program-access";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireMentorSession();
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    return backendResponse(
      await createTranscriptUpload(id, auth.session.userId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("transcriptUploadLinkFailed"),
    });
  }
}
