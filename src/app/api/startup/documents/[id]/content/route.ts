import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { fetchDocumentDownloadUrl } from "@/lib/api/startup-documents";
import { contentDispositionHeader } from "@/lib/content-disposition";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

type SignedFile = {
  url?: string;
  filename?: string;
  contentType?: string;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { userId } = await getSessionIds();
    const signed = await fetchDocumentDownloadUrl(id, userId);
    if (signed.status !== 200) {
      return backendResponse(signed);
    }

    const file = (signed.data ?? {}) as SignedFile;
    if (!file.url) {
      return NextResponse.json(
        { message: "Dosya açılamadı." },
        { status: 502 },
      );
    }

    const upstream = await fetch(file.url);
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { message: "Dosya açılamadı." },
        { status: 502 },
      );
    }

    const contentType =
      file.contentType?.trim() ||
      upstream.headers.get("content-type") ||
      "application/octet-stream";

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDispositionHeader(
          "inline",
          file.filename?.trim() || "document",
        ),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Dosya açılamadı.",
    });
  }
}
