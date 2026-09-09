import { NextResponse } from "next/server";

import type { StartupProfileInput } from "@/interfaces/organization";
import { fetchOrganization, updateOrganization } from "@/lib/api/organization";
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
    return backendResponse(await fetchOrganization(auth.organizationId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Startup profili yüklenemedi.",
    });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireFounderSession();
    if (!auth.ok) return auth.response;
    const profile = (await request.json()) as StartupProfileInput;
    return backendResponse(
      await updateOrganization(
        auth.organizationId,
        auth.session.userId,
        profile,
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Startup profili kaydedilemedi.",
    });
  }
}
