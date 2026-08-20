import type { NextRequest } from "next/server";

import { UserRole } from "@/interfaces/session";
import { fetchUsers } from "@/lib/api/accounts";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";

export async function GET(request: NextRequest) {
  try {
    const role =
      request.nextUrl.searchParams.get("role") === UserRole.Mentor
        ? UserRole.Mentor
        : UserRole.Mentee;
    return backendResponse(await fetchUsers(role));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Demo accounts could not be loaded.",
    });
  }
}
