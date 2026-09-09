import { NextRequest } from "next/server";

import { createReportUpload } from "@/lib/api/meeting-notes";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireMentorSession } from "@/lib/server/require-program-access";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireMentorSession();
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    return backendResponse(await createReportUpload(id, auth.session.userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Rapor yükleme bağlantısı oluşturulamadı.",
    });
  }
}
