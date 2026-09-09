import { NextResponse } from "next/server";

import type { UserProfileInput } from "@/interfaces/user-profile";
import { fetchUserProfile, updateUserProfile } from "@/lib/api/user-profile";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionUser } from "@/lib/session";

async function requireSession() {
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
  return { ok: true as const, session };
}

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;
    return backendResponse(await fetchUserProfile(auth.session.userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Profil yüklenemedi.",
    });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;
    const profile = (await request.json()) as UserProfileInput;
    return backendResponse(
      await updateUserProfile(auth.session.userId, profile),
    );
  } catch (error) {
    return apiErrorResponse(error, { message: "Profil kaydedilemedi." });
  }
}
