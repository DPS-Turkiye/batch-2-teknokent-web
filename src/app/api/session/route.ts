import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { DemoSession } from "@/interfaces/session";
import { getBackendUrl } from "@/lib/const";
import { DEFAULT_USER_ID } from "@/lib/server-session";

type BackendUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  organizationId?: string | null;
  organizationName?: string | null;
  jobTitle?: string | null;
};

function backendHeaders() {
  const username = process.env.BACKEND_USERNAME ?? "teknokent";
  const password = process.env.BACKEND_PASSWORD ?? "change-me";
  return {
    Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
    Accept: "application/json",
  };
}

function toSession(user: BackendUser): DemoSession | null {
  if (!user.organizationId || !user.organizationName) return null;
  return {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    jobTitle: user.jobTitle ?? "Mentee",
    organizationId: user.organizationId,
    organizationName: user.organizationName,
  };
}

async function loadUser(userId: string) {
  const response = await fetch(`${getBackendUrl()}/api/users/${userId}`, {
    headers: backendHeaders(),
    cache: "no-store",
  });
  return response.ok ? ((await response.json()) as BackendUser) : null;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const user = await loadUser(
      cookieStore.get("teknokent_user_id")?.value ?? DEFAULT_USER_ID,
    );
    const session = user ? toSession(user) : null;
    return session
      ? NextResponse.json(session)
      : NextResponse.json(
          { message: "Mentee hesabı bulunamadı." },
          { status: 404 },
        );
  } catch {
    return NextResponse.json(
      { message: "Oturum servisine ulaşılamadı." },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email?: string };
    const response = await fetch(`${getBackendUrl()}/api/users?role=MENTEE`, {
      headers: backendHeaders(),
      cache: "no-store",
    });
    const users = response.ok ? ((await response.json()) as BackendUser[]) : [];
    const user = users.find(
      (candidate) =>
        candidate.email.toLowerCase() === email?.trim().toLowerCase(),
    );
    const session = user ? toSession(user) : null;
    if (!session) {
      return NextResponse.json(
        { message: "Bu e-posta için demo mentee hesabı bulunamadı." },
        { status: 404 },
      );
    }
    const result = NextResponse.json(session);
    result.cookies.set("teknokent_user_id", session.userId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    result.cookies.set("teknokent_organization_id", session.organizationId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return result;
  } catch {
    return NextResponse.json(
      { message: "Demo giriş tamamlanamadı." },
      { status: 502 },
    );
  }
}

export async function DELETE() {
  const result = NextResponse.json({ ok: true });
  result.cookies.delete("teknokent_user_id");
  result.cookies.delete("teknokent_organization_id");
  return result;
}
