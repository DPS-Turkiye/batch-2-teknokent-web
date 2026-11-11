import type { NextRequest } from "next/server";
import { z } from "zod";

import { shareStartupDocument } from "@/lib/api/startup-documents";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { getSessionIds } from "@/lib/session";

const shareSchema = z.object({ mentorId: z.string() });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { userId } = await getSessionIds();
    const body = await readJsonBody(request, shareSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await shareStartupDocument(id, userId, body.data.mentorId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("fileShareFailed"),
    });
  }
}
