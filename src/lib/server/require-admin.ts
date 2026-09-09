import "server-only";

import { NextResponse } from "next/server";

import { UserRole } from "@/interfaces/session";
import { getSessionUser } from "@/lib/session";

export async function requireAdminSession() {
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
  if (session.role !== UserRole.Admin) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          code: "FORBIDDEN",
          message: "Başvuruları yalnızca yöneticiler inceleyebilir.",
        },
        { status: 403 },
      ),
    };
  }
  return { ok: true as const, session };
}
