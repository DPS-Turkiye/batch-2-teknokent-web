import type { NextRequest } from "next/server";
import { z } from "zod";

import { attachDocumentRequestUpload } from "@/lib/api/document-requests";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { getSessionIds } from "@/lib/session";

const uploadSchema = z.object({ storedDocumentId: z.string() });

type RouteContext = { params: Promise<{ itemId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { itemId } = await context.params;
    const { userId } = await getSessionIds();
    const body = await readJsonBody(request, uploadSchema, {
      invalidMessage: "storedDocumentIdRequired",
    });
    if (!body.ok) return body.response;
    return backendResponse(
      await attachDocumentRequestUpload(itemId, {
        actorId: userId,
        storedDocumentId: body.data.storedDocumentId,
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("documentAddFailed"),
    });
  }
}
