import type { NextRequest } from "next/server";

import type { ProgramPlanWeekInput } from "@/interfaces/program-week";
import {
  fetchProgramWeekPlan,
  replaceProgramWeekPlan,
} from "@/lib/api/program-weeks";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

type Context = { params: Promise<{ id: string }> };

function lines(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    return backendResponse(await fetchProgramWeekPlan(auth.session.userId, id));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("weekPlanLoadFailed"),
    });
  }
}

/** The whole plan is replaced; the backend checks week numbers against the program's length. */
export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      weeks?: unknown;
    };
    const weeks: ProgramPlanWeekInput[] = (
      Array.isArray(body.weeks) ? body.weeks : []
    ).map((week: Record<string, unknown>) => ({
      week: Number(week.week),
      title: String(week.title ?? ""),
      topics: lines(week.topics),
      activities: lines(week.activities),
      deliverables: lines(week.deliverables),
      inferred: week.inferred === true,
    }));
    return backendResponse(
      await replaceProgramWeekPlan(auth.session.userId, id, weeks),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("weekPlanSaveFailed"),
    });
  }
}
