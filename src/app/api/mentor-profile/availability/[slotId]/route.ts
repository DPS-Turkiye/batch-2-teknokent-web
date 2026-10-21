import { deleteMentorAvailabilitySlot } from "@/lib/api/mentor-profile";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

type RouteContext = {
  params: Promise<{ slotId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { slotId } = await context.params;
    const { userId } = await getSessionIds();
    return backendResponse(await deleteMentorAvailabilitySlot(userId, slotId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("availabilitySlotDeleteFailed"),
    });
  }
}
