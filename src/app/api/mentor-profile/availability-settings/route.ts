import type { NextRequest } from "next/server";

import {
  fetchMentorAvailabilitySettings,
  updateMentorAvailabilitySettings,
} from "@/lib/api/mentor-profile";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

export async function GET() {
  try {
    const { userId } = await getSessionIds();
    return backendResponse(await fetchMentorAvailabilitySettings(userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Müsaitlik ayarları alınamadı.",
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await getSessionIds();
    return backendResponse(
      await updateMentorAvailabilitySettings(userId, await request.json()),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Müsaitlik ayarları güncellenemedi.",
    });
  }
}
