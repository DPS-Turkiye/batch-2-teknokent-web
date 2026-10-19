import { NextRequest, NextResponse } from "next/server";
import { getLocale } from "next-intl/server";

import { UserAccountStatus } from "@/interfaces/session";
import { fetchSignedInUser, saveSignedInLanguage } from "@/lib/api/auth";
import { isLocale } from "@/lib/i18n";
import {
  destroySession,
  getSessionUser,
  saveSessionUser,
  toSession,
} from "@/lib/session";
import { apiErrorResponse } from "@/lib/server/api-response";
import { readBearerToken } from "@/lib/server/bearer-token";

async function readRememberMe(request: NextRequest): Promise<boolean> {
  try {
    const body = (await request.json()) as { rememberMe?: unknown };
    return body.rememberMe === true;
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const session = await getSessionUser();
    return session
      ? NextResponse.json(session)
      : NextResponse.json(
          { code: "SESSION_REQUIRED", message: "Etkin oturum bulunamadı." },
          { status: 401 },
        );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Oturum servisine ulaşılamıyor.",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const idToken = readBearerToken(request);
    if (!idToken) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: "Firebase kimlik anahtarı gerekli.",
        },
        { status: 400 },
      );
    }

    const response = await fetchSignedInUser(idToken);
    if (response.status === 401) {
      return NextResponse.json(
        {
          code: "REGISTRATION_REQUIRED",
          message: "Bu hesabın kaydı tamamlanmamış.",
        },
        { status: 401 },
      );
    }
    if (response.status !== 200) {
      return NextResponse.json(
        {
          code: "SESSION_REQUIRED",
          message: "Giriş tamamlanamadı.",
        },
        { status: response.status },
      );
    }

    // Before the approval check, so a pending applicant's decision notification is in their language too.
    // Only that wording depends on it, so a failed save must not block sign-in.
    const locale = await getLocale();
    if (isLocale(locale)) {
      await saveSignedInLanguage(idToken, locale).catch(() => undefined);
    }

    const user = response.data;
    if (user.status && user.status !== UserAccountStatus.Approved) {
      return NextResponse.json(
        {
          code: "ACCOUNT_NOT_APPROVED",
          status: user.status,
          message:
            user.status === UserAccountStatus.Rejected
              ? "Başvurunuz onaylanmadı."
              : "Hesabınız koordinatör onayı bekliyor.",
        },
        { status: 403 },
      );
    }

    const session = toSession(user);
    if (!session) {
      return NextResponse.json(
        {
          code: "SESSION_REQUIRED",
          message: "Bu hesap için çalışma alanı hazır değil.",
        },
        { status: 409 },
      );
    }

    const persist = await readRememberMe(request);
    await saveSessionUser(session, persist);
    return NextResponse.json(session);
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Giriş yapılamadı.",
    });
  }
}

export async function DELETE() {
  try {
    await destroySession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Çıkış yapılamadı.",
    });
  }
}
