import type { NextRequest } from "next/server";

import { submitProcessAssignment } from "@/lib/api/startup-process";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { userId, organizationId } = await getSessionIds();
    const { documentId } = (await request.json()) as { documentId: string };
    return backendResponse(
      await submitProcessAssignment(organizationId, id, userId, documentId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Ödev teslim edilemedi.",
    });
  }
}
