import { NextResponse } from "next/server";

import {
  fetchInviteCode,
  regenerateInviteCode,
} from "@/lib/api/organization-invite";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionUser } from "@/lib/session";

async function requireFounderSession() {
  const session = await getSessionUser();
  if (!session?.organizationId) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { code: "SESSION_REQUIRED", message: "No active session." },
        { status: 401 },
      ),
    };
  }
  return { ok: true as const, session };
}

export async function GET() {
  try {
    const auth = await requireFounderSession();
    if (!auth.ok) return auth.response;
    return backendResponse(
      await fetchInviteCode(auth.session.organizationId, auth.session.userId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Invite code could not be loaded.",
    });
  }
}

export async function POST() {
  try {
    const auth = await requireFounderSession();
    if (!auth.ok) return auth.response;
    return backendResponse(
      await regenerateInviteCode(
        auth.session.organizationId,
        auth.session.userId,
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Invite code could not be regenerated.",
    });
  }
}
