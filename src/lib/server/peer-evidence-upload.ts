import { NextResponse, type NextRequest } from "next/server";
import "server-only";

import {
  PeerDocumentVisibility,
  PeerEvidenceType,
} from "@/interfaces/peer-mentor-documents";
import { isEnumValue } from "@/lib/enum";
import { PEER_EVIDENCE_MAX_BYTES } from "@/lib/peer-mentor-documents";
import { apiText, type ApiErrorCode } from "@/lib/server/api-response";

/** Room for the form's other fields and boundaries on top of the largest file. */
const FORM_OVERHEAD_BYTES = 64 * 1024;
const INVALID_REQUEST: ApiErrorCode = "INVALID_REQUEST";

export type PeerEvidenceUpload =
  { ok: true; form: FormData } | { ok: false; response: NextResponse };

async function refused(): Promise<PeerEvidenceUpload> {
  return {
    ok: false,
    response: NextResponse.json(
      {
        code: INVALID_REQUEST,
        message: await apiText("invalidRequestFields"),
        fields: [],
      },
      { status: 400 },
    ),
  };
}

/**
 * The peer-evidence upload form, checked before it is passed on: a body no larger than one file can make, a non-empty
 * file within the limit, and a known type that is a file (a portfolio is a link). The form is rebuilt from these three
 * fields only, so nothing else the browser sends reaches the backend.
 */
export async function readPeerEvidenceUpload(
  request: NextRequest,
): Promise<PeerEvidenceUpload> {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > PEER_EVIDENCE_MAX_BYTES + FORM_OVERHEAD_BYTES) return refused();
  const sent = await request.formData();
  const file = sent.get("file");
  const evidenceType = sent.get("evidenceType");
  const visibility = sent.get("visibility");
  if (
    file === null ||
    typeof file === "string" ||
    file.size === 0 ||
    file.size > PEER_EVIDENCE_MAX_BYTES ||
    !isEnumValue(PeerEvidenceType, evidenceType) ||
    evidenceType === PeerEvidenceType.Portfolio ||
    !isEnumValue(PeerDocumentVisibility, visibility)
  ) {
    return refused();
  }
  const form = new FormData();
  form.set("file", file);
  form.set("evidenceType", evidenceType);
  form.set("visibility", visibility);
  return { ok: true, form };
}
