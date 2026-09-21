import { NextResponse } from "next/server";

import type { UserProfileInput } from "@/interfaces/user-profile";
import { fetchUserProfile, updateUserProfile } from "@/lib/api/user-profile";
import { fetchSignedInUser } from "@/lib/api/auth";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { readBearerToken } from "@/lib/server/bearer-token";
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

export async function GET(request: Request) {
  try {
    const idToken = readBearerToken(request);
    if (idToken) {
      const me = await fetchSignedInUser(idToken);
      if (me.status !== 200) return backendResponse(me);
      const userId = (me.data as { id: string }).id;
      return backendResponse(await fetchUserProfile(userId, idToken));
    }
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
    const profile = (await request.json()) as UserProfileInput;
    const idToken = readBearerToken(request);
    if (idToken) {
      // Onboarding saves the person's own profile before approval, without a session cookie.
      const me = await fetchSignedInUser(idToken);
      if (me.status !== 200) return backendResponse(me);
      const userId = (me.data as { id: string }).id;
      return backendResponse(await updateUserProfile(userId, profile, idToken));
    }
    const auth = await requireSession();
    if (!auth.ok) return auth.response;
    return backendResponse(
      await updateUserProfile(auth.session.userId, profile),
    );
  } catch (error) {
    return apiErrorResponse(error, { message: "Profil kaydedilemedi." });
  }
}
