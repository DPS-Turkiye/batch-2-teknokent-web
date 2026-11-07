import "server-only";

import type { NextRequest } from "next/server";

import { ISO_DAY_PATTERN } from "@/lib/utils";

/** The report's from/to days from the query string, or null when either is missing or not yyyy-mm-dd. */
export function readReportRange(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  if (
    !from ||
    !to ||
    !ISO_DAY_PATTERN.test(from) ||
    !ISO_DAY_PATTERN.test(to)
  ) {
    return null;
  }
  return { from, to };
}
