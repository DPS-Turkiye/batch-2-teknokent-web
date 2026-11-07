import {
  fetchCoordinatorProgram,
  updateCoordinatorProgram,
} from "@/lib/api/coordinator-programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    return backendResponse(
      await fetchCoordinatorProgram(auth.session.userId, id),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("programLoadFailed"),
    });
  }
}

function optionalNumber(value: unknown) {
  return value == null ? undefined : Number(value);
}

function optionalBoolean(value: unknown) {
  return value == null ? undefined : value === true;
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = await request.json();
    return backendResponse(
      await updateCoordinatorProgram(auth.session.userId, id, {
        name: String(body.name ?? ""),
        description: body.description ?? null,
        startDate: body.startDate ?? null,
        endDate: body.endDate ?? null,
        meetingFrequencyDays: Number(body.meetingFrequencyDays),
        staleAfterDays: Number(body.staleAfterDays),
        meetingNoteRequired: body.meetingNoteRequired === true,
        autoMatchSuggestions: body.autoMatchSuggestions === true,
        defaultMentorCapacity: optionalNumber(body.defaultMentorCapacity),
        communicationGapDays: optionalNumber(body.communicationGapDays),
        bottleneckFlagDays: optionalNumber(body.bottleneckFlagDays),
        eligibleEmailDomain:
          body.eligibleEmailDomain == null
            ? undefined
            : String(body.eligibleEmailDomain),
        rosterOnly: optionalBoolean(body.rosterOnly),
        individualMentees: optionalBoolean(body.individualMentees),
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("programSaveFailed"),
    });
  }
}
