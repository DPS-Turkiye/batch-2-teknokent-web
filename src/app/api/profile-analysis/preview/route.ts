import { NextRequest, NextResponse } from "next/server";

import { parseCvPreview } from "@/lib/api/profile-analysis";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";

/**
 * Unauthenticated by design, like /api/programs/names: it feeds the signup CV
 * step, and someone half-way through signup has no account or session cookie.
 * The proxy still authenticates to Spring Boot with the service credentials.
 *
 * Its sibling POST / is the org-scoped path that writes a stored document and a
 * profile_analysis row; that is exactly what signup cannot use, since the
 * organization does not exist yet. This one persists nothing at either end, so
 * there is no data to scope and nothing to leak between startups.
 */
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: "Bir CV dosyası gerekli." },
        { status: 400 },
      );
    }
    return backendResponse(await parseCvPreview(file as File));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "CV okunamadı. Bilgileri elle girebilirsin.",
    });
  }
}
