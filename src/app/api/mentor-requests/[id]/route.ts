import type { NextRequest } from "next/server";

import { fetchMentorRequest } from "@/lib/api/mentor-requests";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return backendResponse(await fetchMentorRequest(id));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Mentorluk talebi hizmetine ulaşılamıyor.",
    });
  }
}
