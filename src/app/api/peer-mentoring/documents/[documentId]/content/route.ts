import { NextResponse } from "next/server";

import { fetchPeerMentorDocumentContent } from "@/lib/api/peer-mentor-documents";
import { contentDispositionHeader } from "@/lib/content-disposition";
import { apiErrorResponse, apiText } from "@/lib/server/api-response";
import { readUuidParam } from "@/lib/server/path-params";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

const PDF = "application/pdf";

/**
 * A peer mentor's file ("Görüntüle"). The backend decides who may read which; the file always leaves as an
 * attachment, so an uploaded file is never rendered in this origin.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const document = await readUuidParam(
      (await params).documentId,
      "invalidRequestFields",
    );
    if (!document.ok) return document.response;
    const file = await fetchPeerMentorDocumentContent(
      session.userId,
      document.id,
    );
    if (file.status !== 200) {
      return NextResponse.json(
        { message: await apiText("fileOpenFailed") },
        { status: file.status },
      );
    }
    const type = file.headers["content-type"];
    const disposition = file.headers["content-disposition"];
    return new NextResponse(Buffer.from(file.data), {
      status: 200,
      headers: {
        // Peer evidence is PDF only; anything else the backend might say is served as opaque bytes.
        "Content-Type": type === PDF ? PDF : "application/octet-stream",
        "Content-Disposition":
          typeof disposition === "string" && /^attachment/i.test(disposition)
            ? disposition
            : contentDispositionHeader("attachment", "document.pdf"),
        "Content-Security-Policy": "sandbox; default-src 'none'",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("fileOpenFailed"),
    });
  }
}
