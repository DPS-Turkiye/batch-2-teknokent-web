import type { NextRequest } from "next/server";

import { fetchCoordinatorCandidate } from "@/lib/api/admin-coordinators";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/require-admin";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    const email = request.nextUrl.searchParams.get("email") ?? "";
    return backendResponse(
      await fetchCoordinatorCandidate(auth.session.userId, email),
    );
  } catch (error) {
    return apiErrorResponse(error, { message: "E-posta kontrol edilemedi." });
  }
}
