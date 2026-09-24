import { type NextRequest, NextResponse } from "next/server";

import { fetchCoordinatorCalendar } from "@/lib/api/coordinator-calendar";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const search = request.nextUrl.searchParams;
    const from = search.get("from") ?? "";
    const to = search.get("to") ?? "";
    if (!DAY.test(from) || !DAY.test(to)) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: "Geçerli bir tarih aralığı seçin.",
        },
        { status: 400 },
      );
    }
    return backendResponse(
      await fetchCoordinatorCalendar(auth.session.userId, {
        from,
        to,
        programId: search.get("programId"),
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, { message: "Takvim yüklenemedi." });
  }
}
