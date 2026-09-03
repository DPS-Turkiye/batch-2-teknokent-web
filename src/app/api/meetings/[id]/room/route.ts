import { UserRole } from "@/interfaces/session";
import { fetchMeetingRoom } from "@/lib/api/meetings";
import { requireOwnedMeeting } from "@/lib/server/mentor-meeting";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionUser } from "@/lib/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getSessionUser();
    if (session?.role !== UserRole.Mentor) {
      return Response.json(
        { code: "FORBIDDEN", message: "Toplantı odası yalnızca mentöre açık." },
        { status: 403 },
      );
    }
    const { id } = await context.params;
    const owned = await requireOwnedMeeting(session.userId, id);
    if ("error" in owned) return owned.error;
    return backendResponse(await fetchMeetingRoom(id));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Meeting room could not be loaded.",
    });
  }
}
