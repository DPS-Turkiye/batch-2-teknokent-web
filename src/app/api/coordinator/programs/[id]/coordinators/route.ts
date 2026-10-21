import {
  addProgramCoordinator,
  fetchProgramCoordinators,
} from "@/lib/api/coordinator-programs";
import { ALREADY_COORDINATOR } from "@/lib/const";
import type { BackendResponse } from "@/lib/server/backend-client";
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
      await fetchProgramCoordinators(auth.session.userId, id),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("coordinatorsLoadFailed"),
    });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = await request.json();
    const response = await addProgramCoordinator(
      auth.session.userId,
      id,
      String(body.userId ?? ""),
    );
    return backendResponse(await translateAssignment(response));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("coordinatorAddFailed"),
    });
  }
}

async function translateAssignment(
  response: BackendResponse,
): Promise<BackendResponse> {
  if (
    response.status !== 400 ||
    !response.data ||
    typeof response.data !== "object"
  ) {
    return response;
  }
  const message =
    "message" in response.data && typeof response.data.message === "string"
      ? response.data.message
      : "";
  if (message.includes("already runs")) {
    return {
      ...response,
      data: {
        ...response.data,
        code: ALREADY_COORDINATOR,
        message: await apiText("alreadyProgramCoordinator"),
      },
    };
  }
  if (!message.includes("approved coordinator")) return response;
  return {
    ...response,
    data: {
      ...response.data,
      message: await apiText("onlyApprovedCoordinator"),
    },
  };
}
