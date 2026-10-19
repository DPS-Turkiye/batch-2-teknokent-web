import { UserAccountStatus } from "@/interfaces/session";
import { fetchUsers } from "@/lib/api/accounts";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/require-admin";

export async function GET() {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    return backendResponse(
      await fetchUsers({ status: UserAccountStatus.Pending }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("pendingAccountsLoadFailed"),
    });
  }
}
