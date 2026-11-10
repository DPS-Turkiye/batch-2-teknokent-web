import "server-only";

import { NextResponse } from "next/server";

import { apiText } from "@/lib/server/api-response";

/**
 * The assistant acts on one meeting for one person, so the backend checks that
 * person against the meeting. It can only do that with the caller's own Firebase
 * token; the shared service login names nobody and is refused there.
 */
export async function assistantSignInRequired() {
  return NextResponse.json(
    { code: "SESSION_REQUIRED", message: await apiText("sessionMissing") },
    { status: 401 },
  );
}

/**
 * The backend's refusal: an expired or unknown token, a meeting the caller is
 * not part of, or one it doesn't know. Its own text is English and internal.
 */
export async function assistantMeetingRefusal(status: number) {
  if (status === 401) return assistantSignInRequired();
  if (status === 403) {
    return NextResponse.json(
      {
        code: "FORBIDDEN",
        message: await apiText("assistantMeetingForbidden"),
      },
      { status },
    );
  }
  if (status === 404) {
    return NextResponse.json(
      { code: "NOT_FOUND", message: await apiText("assistantMeetingNotFound") },
      { status },
    );
  }
  return null;
}
