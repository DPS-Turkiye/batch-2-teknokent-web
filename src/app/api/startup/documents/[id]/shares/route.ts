import type { NextRequest } from "next/server";

import { shareStartupDocument } from "@/lib/api/startup-documents";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { userId } = await getSessionIds();
    const { mentorId } = (await request.json()) as { mentorId: string };
    return backendResponse(await shareStartupDocument(id, userId, mentorId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("fileShareFailed"),
    });
  }
}
