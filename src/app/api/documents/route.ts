import { NextRequest, NextResponse } from "next/server";

import { uploadStoredDocument } from "@/lib/api/documents";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

const BEARER_PREFIX = "Bearer ";

export async function POST(request: NextRequest) {
  try {
    const header = request.headers.get("authorization");
    const idToken = header?.startsWith(BEARER_PREFIX)
      ? header.slice(BEARER_PREFIX.length).trim()
      : null;
    const form = await request.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") ?? "").trim();
    if (!(file instanceof Blob) || !kind) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: "A file and document kind are required.",
        },
        { status: 400 },
      );
    }

    if (idToken) {
      return backendResponse(
        await uploadStoredDocument({ file: file as File, kind, idToken }),
      );
    }

    const { userId } = await getSessionIds();
    return backendResponse(
      await uploadStoredDocument({ file: file as File, kind, userId }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "The file could not be stored.",
    });
  }
}
