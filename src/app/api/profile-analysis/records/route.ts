import { NextResponse, type NextRequest } from "next/server";

import { ProfileAnalysisRecordScope } from "@/interfaces/profile-analysis";
import {
  createStartupProfileRecord,
  fetchProfileAnalysisRecord,
} from "@/lib/api/profile-analysis-records";
import { startupAnalysisRequestSchema } from "@/lib/profile-analysis-request";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireProfileAnalysisSession } from "@/lib/server/profile-analysis-access";

export async function GET(request: NextRequest) {
  try {
    const session = await requireProfileAnalysisSession();
    if (!session) {
      return NextResponse.json({ code: "FORBIDDEN" }, { status: 403 });
    }
    const scope = Object.values(ProfileAnalysisRecordScope).find(
      (value) => value === request.nextUrl.searchParams.get("scope"),
    );
    if (!scope)
      return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });
    return backendResponse(
      await fetchProfileAnalysisRecord(session.userId, scope),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("profileServiceUnavailable"),
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireProfileAnalysisSession();
    if (!session) {
      return NextResponse.json({ code: "FORBIDDEN" }, { status: 403 });
    }
    const parsed = startupAnalysisRequestSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });
    return backendResponse(
      await createStartupProfileRecord(session.userId, parsed.data.profile),
    );
  } catch (error) {
    if (error instanceof SyntaxError)
      return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });
    return apiErrorResponse(error, {
      message: await apiText("profileServiceUnavailable"),
    });
  }
}
