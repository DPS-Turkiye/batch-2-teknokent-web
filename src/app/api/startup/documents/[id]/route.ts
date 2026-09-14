import type { NextRequest } from "next/server";

import { deleteStartupDocument } from "@/lib/api/startup-documents";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { userId } = await getSessionIds();
    return backendResponse(await deleteStartupDocument(id, userId));
  } catch (error) {
    return apiErrorResponse(error, { message: "Dosya silinemedi." });
  }
}
