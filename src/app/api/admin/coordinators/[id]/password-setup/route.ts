import { resendCoordinatorPasswordSetup } from "@/lib/api/admin-coordinators";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/require-admin";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    return backendResponse(
      await resendCoordinatorPasswordSetup(auth.session.userId, id),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Şifre belirleme e-postası gönderilemedi.",
    });
  }
}
