import type { NextRequest } from "next/server";

import { recommendFromProfileAnalysis } from "@/lib/api/profile-analysis";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return backendResponse(await recommendFromProfileAnalysis(id));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Matching service is unavailable.",
    });
  }
}
