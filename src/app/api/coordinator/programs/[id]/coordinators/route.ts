import { z } from "zod";

import {
  addProgramCoordinator,
  fetchProgramCoordinators,
} from "@/lib/api/coordinator-programs";
import { ALREADY_COORDINATOR } from "@/lib/const";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import type { BackendResponse } from "@/lib/server/backend-client";
import { readJsonBody } from "@/lib/server/request-body";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

const addCoordinatorSchema = z.object({ userId: z.string() });

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
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
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = await readJsonBody(request, addCoordinatorSchema);
    if (!body.ok) return body.response;
    const response = await addProgramCoordinator(
      auth.session.userId,
      id,
      body.data.userId,
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
