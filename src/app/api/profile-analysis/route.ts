import { NextRequest, NextResponse } from "next/server";

import {
  createProfileAnalysis,
  fetchLatestProfileAnalysis,
  type OcrMode,
  type ProfileType,
} from "@/lib/api/profile-analysis";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

const OCR_MODES = new Set<OcrMode>(["auto", "force", "off"]);

export async function GET() {
  try {
    const { organizationId } = await getSessionIds();
    return backendResponse(await fetchLatestProfileAnalysis(organizationId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Profile service is unavailable.",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await getSessionIds();
    const form = await request.formData();
    const file = form.get("file");
    const profileType: ProfileType =
      form.get("profileType") === "individual_mentee"
        ? "individual_mentee"
        : "mentee";
    const consentAccepted = form.get("consentAccepted") === "true";
    const requestedOcrMode = String(form.get("ocrMode"));
    const ocrMode: OcrMode = OCR_MODES.has(requestedOcrMode as OcrMode)
      ? (requestedOcrMode as OcrMode)
      : "auto";

    if (!(file instanceof File)) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: "A PDF file is required." },
        { status: 400 },
      );
    }
    if (!consentAccepted) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: "Document processing consent is required.",
        },
        { status: 400 },
      );
    }

    return backendResponse(
      await createProfileAnalysis({
        file,
        ocrMode,
        organizationId,
        profileType,
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Profile service is unavailable.",
    });
  }
}
