import { type NextRequest, NextResponse } from "next/server";

import { fetchProgramMeetingRatings } from "@/lib/api/program-report";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const from = request.nextUrl.searchParams.get("from");
    if (from != null && !DAY.test(from)) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: "Geçerli bir tarih seçin." },
        { status: 400 },
      );
    }
    return backendResponse(
      await fetchProgramMeetingRatings(auth.session.userId, id, from),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Görüşme değerlendirmeleri yüklenemedi.",
    });
  }
}
