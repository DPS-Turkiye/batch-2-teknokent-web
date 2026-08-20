import type { NextRequest } from "next/server";

import { fetchUsers } from "@/lib/api/accounts";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";

export async function GET(request: NextRequest) {
  try {
    const role =
      request.nextUrl.searchParams.get("role") === "MENTOR"
        ? "MENTOR"
        : "MENTEE";
    return backendResponse(await fetchUsers(role));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Demo accounts could not be loaded.",
    });
  }
}
