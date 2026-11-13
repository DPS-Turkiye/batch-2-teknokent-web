import { removeMentorFromProgram } from "@/lib/api/admin-program-members";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/require-admin";

// No body: the path names the program and the mentor, and the session names the admin.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; targetId: string }> },
) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    const { id, targetId } = await params;
    return backendResponse(
      await removeMentorFromProgram(auth.session.userId, id, targetId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("programMentorRemoveFailed"),
    });
  }
}
