import type { NextRequest } from "next/server";

import { UserAccountStatus } from "@/interfaces/session";
import { decideAccountStatus } from "@/lib/api/accounts";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/require-admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;

    const body = (await request.json()) as { status?: string };
    const status =
      body.status === UserAccountStatus.Approved
        ? UserAccountStatus.Approved
        : body.status === UserAccountStatus.Rejected
          ? UserAccountStatus.Rejected
          : null;
    if (!status) {
      return apiErrorResponse(new Error("Invalid status"), {
        code: "INVALID_REQUEST",
        message: "Durum APPROVED veya REJECTED olmalıdır.",
        status: 400,
      });
    }

    const { id } = await context.params;
    return backendResponse(
      await decideAccountStatus(id, auth.session.userId, status),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Hesap durumu güncellenemedi.",
    });
  }
}
