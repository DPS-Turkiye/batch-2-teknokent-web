import { NextResponse } from "next/server";

import type { CreateStartupInput } from "@/interfaces/organization";
import { UserRole } from "@/interfaces/session";
import { createStartup } from "@/lib/api/organization";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser, refreshSessionUser } from "@/lib/session";

/** "Startup'ımı oluştur" on /startup. Answers with the session, now carrying the startup. */
export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (session?.role !== UserRole.Mentee) throw new SessionRequiredError();
    const input = (await request.json()) as CreateStartupInput;
    const response = await createStartup(session.userId, input);
    if (response.status !== 201) return backendResponse(response);
    return NextResponse.json(await refreshSessionUser(response.data), {
      status: 201,
    });
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("startupCreateFailed"),
    });
  }
}
