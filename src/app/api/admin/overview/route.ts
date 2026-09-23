import { fetchAdminOverview } from "@/lib/api/admin-overview";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/require-admin";

export async function GET() {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    return backendResponse(await fetchAdminOverview(auth.session.userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Yönetim özeti yüklenemedi.",
    });
  }
}
