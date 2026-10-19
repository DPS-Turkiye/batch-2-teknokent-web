import { type NextRequest } from "next/server";

import { attachDocumentRequestUpload } from "@/lib/api/document-requests";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

type RouteContext = { params: Promise<{ itemId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { itemId } = await context.params;
    const { userId } = await getSessionIds();
    const body = (await request.json()) as { storedDocumentId?: unknown };
    if (typeof body.storedDocumentId !== "string") {
      return Response.json(
        {
          code: "INVALID_REQUEST",
          message: await apiText("storedDocumentIdRequired"),
        },
        { status: 400 },
      );
    }
    return backendResponse(
      await attachDocumentRequestUpload(itemId, {
        actorId: userId,
        storedDocumentId: body.storedDocumentId,
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("documentAddFailed"),
    });
  }
}
