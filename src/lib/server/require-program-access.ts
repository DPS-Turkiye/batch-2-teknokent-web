import "server-only";

import { NextResponse } from "next/server";

import { UserRole, type AppSession } from "@/interfaces/session";
import { getSessionUser } from "@/lib/session";
import { apiText, type ApiTextKey } from "@/lib/server/api-response";

async function requireRole(
  role: UserRole,
  forbidden: ApiTextKey,
): Promise<
  { ok: true; session: AppSession } | { ok: false; response: NextResponse }
> {
  const session = await getSessionUser();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        { code: "SESSION_REQUIRED", message: await apiText("sessionMissing") },
        { status: 401 },
      ),
    };
  }
  if (session.role !== role) {
    return {
      ok: false,
      response: NextResponse.json(
        { code: "FORBIDDEN", message: await apiText(forbidden) },
        { status: 403 },
      ),
    };
  }
  return { ok: true, session };
}

export function requireCoordinatorSession() {
  return requireRole(UserRole.Coordinator, "coordinatorsOnlyManage");
}

export function requireMentorSession() {
  return requireRole(UserRole.Mentor, "mentorsOnlyAction");
}

/**
 * A startup member acting on their own organization's programs. Distinct from the
 * coordinator and mentor guards: those serve the global program list, while this
 * one gates the /mine endpoints, which are scoped to the caller's organization.
 * A mentee with no organization cannot have assignments, so it is refused here
 * rather than reaching the backend.
 */
export async function requireStartupSession() {
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
  if (session.role !== UserRole.Mentee || !session.organizationId) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          code: "FORBIDDEN",
          message: await apiText("startupMembersOnlyPrograms"),
        },
        { status: 403 },
      ),
    };
  }
  return { ok: true as const, session };
}

export async function requireCoordinatorOrMentorSession() {
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
  if (
    session.role !== UserRole.Coordinator &&
    session.role !== UserRole.Mentor &&
    session.role !== UserRole.Admin
  ) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          code: "FORBIDDEN",
          message: await apiText("coordinatorsAndMentorsOnlyPrograms"),
        },
        { status: 403 },
      ),
    };
  }
  return { ok: true as const, session };
}
