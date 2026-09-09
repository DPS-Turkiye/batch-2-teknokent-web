import { NextResponse } from "next/server";

import {
  fetchInviteCode,
  regenerateInviteCode,
} from "@/lib/api/organization-invite";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionUser } from "@/lib/session";

async function requireFounderSession() {
  const session = await getSessionUser();
  const organizationId = session?.organizationId;
  if (!session || !organizationId) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { code: "SESSION_REQUIRED", message: "Etkin oturum bulunamadı." },
        { status: 401 },
      ),
    };
  }
  return { ok: true as const, session, organizationId };
}

export async function GET() {
  try {
    const auth = await requireFounderSession();
    if (!auth.ok) return auth.response;
    return backendResponse(
      await fetchInviteCode(auth.organizationId, auth.session.userId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Davet kodu yüklenemedi.",
    });
  }
}

export async function POST() {
  try {
    const auth = await requireFounderSession();
    if (!auth.ok) return auth.response;
    return backendResponse(
      await regenerateInviteCode(auth.organizationId, auth.session.userId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Davet kodu yenilenemedi.",
    });
  }
}
