import { createCoordinatorProgramEvent } from "@/lib/api/coordinator-programs";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = await request.json();
    return backendResponse(
      await createCoordinatorProgramEvent(auth.session.userId, id, {
        title: body.title,
        kind: body.kind,
        startsAt: body.startsAt,
        endsAt: body.endsAt ?? null,
        description: body.description ?? null,
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Etkinlik eklenemedi.",
    });
  }
}
