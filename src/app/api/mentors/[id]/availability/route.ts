import type { NextRequest } from "next/server";

import {
  createMentorAvailability,
  fetchMentorAvailability,
} from "@/lib/api/mentors";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    return backendResponse(await fetchMentorAvailability(id));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Mentor availability could not be loaded.",
    });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const data = (await request.json()) as {
      startsAt: string;
      durationMinutes?: number;
    };
    return backendResponse(await createMentorAvailability(id, data));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Availability slot could not be created.",
    });
  }
}
