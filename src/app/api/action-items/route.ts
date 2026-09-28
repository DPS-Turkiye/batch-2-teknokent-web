import { NextResponse, type NextRequest } from "next/server";

import { createActionItem, fetchActionItems } from "@/lib/api/action-items";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

function missingRequestId() {
  return NextResponse.json(
    { code: "INVALID_REQUEST", message: "Talep kimliği gerekli." },
    { status: 400 },
  );
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await getSessionIds();
    const requestId = request.nextUrl.searchParams.get("requestId");
    if (!requestId) return missingRequestId();

    return backendResponse(await fetchActionItems(requestId, userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Aksiyonlar yüklenemedi.",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await getSessionIds();
    const { requestId, ...payload } = (await request.json()) as Record<
      string,
      unknown
    >;
    if (typeof requestId !== "string") return missingRequestId();

    return backendResponse(
      await createActionItem(userId, {
        ...payload,
        mentorshipRequestId: requestId,
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Aksiyon oluşturulamadı.",
    });
  }
}
