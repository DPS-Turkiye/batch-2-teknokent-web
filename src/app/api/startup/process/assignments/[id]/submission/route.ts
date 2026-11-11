import type { NextRequest } from "next/server";
import { z } from "zod";

import { submitProcessAssignment } from "@/lib/api/startup-process";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { getSessionIds } from "@/lib/session";

const submissionSchema = z.object({ documentId: z.string() });

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { userId, organizationId } = await getSessionIds();
    const body = await readJsonBody(request, submissionSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await submitProcessAssignment(
        organizationId,
        id,
        userId,
        body.data.documentId,
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("assignmentSubmitFailed"),
    });
  }
}
