import { deleteMentorAvailabilityRule } from "@/lib/api/mentor-profile";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

type RouteContext = {
  params: Promise<{ ruleId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { ruleId } = await context.params;
    const { userId } = await getSessionIds();
    return backendResponse(await deleteMentorAvailabilityRule(userId, ruleId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("availabilityRuleDeleteFailed"),
    });
  }
}
