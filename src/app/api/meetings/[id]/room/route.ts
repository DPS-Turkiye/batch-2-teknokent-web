import { UserRole } from "@/interfaces/session";
import { fetchMeetingRoom } from "@/lib/api/meetings";
import { requireOwnedMeeting } from "@/lib/server/mentor-meeting";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session, UserRole.Mentor)) {
      return Response.json(
        { code: "FORBIDDEN", message: await apiText("meetingRoomMentorOnly") },
        { status: 403 },
      );
    }
    const { id } = await context.params;
    const owned = await requireOwnedMeeting(session.userId, id);
    if ("error" in owned) return owned.error;
    return backendResponse(await fetchMeetingRoom(id));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("meetingRoomLoadFailed"),
    });
  }
}
