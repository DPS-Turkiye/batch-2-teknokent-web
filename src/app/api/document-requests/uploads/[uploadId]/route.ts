import { type NextRequest } from "next/server";

import { deleteDocumentRequestUpload } from "@/lib/api/document-requests";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

type RouteContext = { params: Promise<{ uploadId: string }> };

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { uploadId } = await context.params;
    const { userId } = await getSessionIds();
    return backendResponse(await deleteDocumentRequestUpload(uploadId, userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Belge kaldırılamadı.",
    });
  }
}
