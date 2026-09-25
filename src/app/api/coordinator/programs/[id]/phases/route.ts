import { replaceCoordinatorProgramPhases } from "@/lib/api/coordinator-programs";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = await request.json();
    const phases = Array.isArray(body.phases) ? body.phases : [];
    return backendResponse(
      await replaceCoordinatorProgramPhases(
        auth.session.userId,
        id,
        phases.map((phase: Record<string, unknown>) => ({
          name: String(phase.name ?? ""),
          startDate: (phase.startDate as string | null) ?? null,
          endDate: (phase.endDate as string | null) ?? null,
        })),
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, { message: "Fazlar kaydedilemedi." });
  }
}
