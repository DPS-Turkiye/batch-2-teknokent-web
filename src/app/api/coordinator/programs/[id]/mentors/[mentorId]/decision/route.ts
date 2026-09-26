import { decideProgramMentor } from "@/lib/api/coordinator-programs";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; mentorId: string }> },
) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id, mentorId } = await params;
    const body = await request.json();
    return backendResponse(
      await decideProgramMentor(
        auth.session.userId,
        id,
        mentorId,
        body.accepted === true,
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, { message: "Karar kaydedilemedi." });
  }
}
