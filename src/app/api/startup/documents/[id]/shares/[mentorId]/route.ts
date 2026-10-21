import type { NextRequest } from "next/server";

import { unshareStartupDocument } from "@/lib/api/startup-documents";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; mentorId: string }> },
) {
  try {
    const { id, mentorId } = await params;
    const { userId } = await getSessionIds();
    return backendResponse(await unshareStartupDocument(id, mentorId, userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("shareRemoveFailed"),
    });
  }
}
