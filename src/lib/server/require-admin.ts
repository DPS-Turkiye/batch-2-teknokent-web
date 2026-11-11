import { NextResponse } from "next/server";
import "server-only";

import { UserRole } from "@/interfaces/session";
import { hasPermission } from "@/lib/permissions";
import { apiText } from "@/lib/server/api-response";
import { getSessionUser } from "@/lib/session";

export async function requireAdminSession() {
  const session = await getSessionUser();
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { code: "SESSION_REQUIRED", message: await apiText("sessionMissing") },
        { status: 401 },
      ),
    };
  }
  if (!hasPermission(session, UserRole.Admin)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          code: "FORBIDDEN",
          message: await apiText("adminsOnlyReview"),
        },
        { status: 403 },
      ),
    };
  }
  return { ok: true as const, session };
}
