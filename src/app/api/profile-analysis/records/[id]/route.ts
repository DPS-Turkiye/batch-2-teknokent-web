import { NextResponse, type NextRequest } from "next/server";

import { confirmStartupProfileRecord } from "@/lib/api/profile-analysis-records";
import { startupAnalysisRequestSchema } from "@/lib/profile-analysis-request";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireProfileAnalysisSession } from "@/lib/server/profile-analysis-access";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireProfileAnalysisSession();
    if (!session)
      return NextResponse.json({ code: "FORBIDDEN" }, { status: 403 });
    const parsed = startupAnalysisRequestSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });
    const { id } = await params;
    return backendResponse(
      await confirmStartupProfileRecord(
        session.userId,
        id,
        parsed.data.profile,
      ),
    );
  } catch (error) {
    if (error instanceof SyntaxError)
      return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });
    return apiErrorResponse(error, {
      message: await apiText("profileSaveFailed"),
    });
  }
}
