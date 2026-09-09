import "server-only";

import { NextResponse } from "next/server";

import { UserRole, type AppSession } from "@/interfaces/session";
import { getSessionUser } from "@/lib/session";

async function requireRole(
  role: UserRole,
  forbiddenMessage: string,
): Promise<
  { ok: true; session: AppSession } | { ok: false; response: NextResponse }
> {
  const session = await getSessionUser();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        { code: "SESSION_REQUIRED", message: "Etkin oturum bulunamadı." },
        { status: 401 },
      ),
    };
  }
  if (session.role !== role) {
    return {
      ok: false,
      response: NextResponse.json(
        { code: "FORBIDDEN", message: forbiddenMessage },
        { status: 403 },
      ),
    };
  }
  return { ok: true, session };
}

export function requireCoordinatorSession() {
  return requireRole(
    UserRole.Coordinator,
    "Programları yalnızca koordinatörler yönetebilir.",
  );
}

export function requireMentorSession() {
  return requireRole(
    UserRole.Mentor,
    "Bu işlemi yalnızca mentorlar yapabilir.",
  );
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
        { code: "SESSION_REQUIRED", message: "Etkin oturum bulunamadı." },
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
          message: "Programlarını yalnızca startup üyeleri görüntüleyebilir.",
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
        { code: "SESSION_REQUIRED", message: "Etkin oturum bulunamadı." },
        { status: 401 },
      ),
    };
  }
  if (
    session.role !== UserRole.Coordinator &&
    session.role !== UserRole.Mentor
  ) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          code: "FORBIDDEN",
          message:
            "Programları yalnızca koordinatörler ve mentorlar görüntüleyebilir.",
        },
        { status: 403 },
      ),
    };
  }
  return { ok: true as const, session };
}
