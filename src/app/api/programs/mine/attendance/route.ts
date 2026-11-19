import { fetchMyAttendance } from "@/lib/api/program-attendance";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireStartupSession } from "@/lib/server/require-program-access";

/** The signed-in participant's attendance this week; check-ins are by session QR code. */
export async function GET() {
  try {
    const auth = await requireStartupSession();
    if (!auth.ok) return auth.response;
    return backendResponse(await fetchMyAttendance(auth.session.userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("attendanceLoadFailed"),
    });
  }
}
