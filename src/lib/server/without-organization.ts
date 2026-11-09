import "server-only";

import { NextResponse } from "next/server";

import type { PageResponse } from "@/interfaces/page-response";

// A session without a startup has a blank organization. Sent to the backend as a list's filter, a blank one
// used to read as "no filter", so routes answer these sessions here instead of asking the backend.

export function emptyListWithoutOrganization() {
  return NextResponse.json([]);
}

export function emptyPageWithoutOrganization(page: number, size: number) {
  const empty: PageResponse<never> = {
    content: [],
    page,
    size,
    totalElements: 0,
    totalPages: 0,
  };
  return NextResponse.json(empty);
}

export function forbiddenWithoutOrganization() {
  return NextResponse.json({ code: "FORBIDDEN" }, { status: 403 });
}
