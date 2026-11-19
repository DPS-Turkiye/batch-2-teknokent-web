import type { Metadata } from "next";

import { SessionCheckInView } from "@/components/attendance/session-check-in-view";

// The token is in this page's address: it must not leave in a Referer header or end up in a search index.
export const metadata: Metadata = {
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

/** A session QR code's link. Signed-out visitors are sent to sign in first and come back here (src/proxy.ts). */
export default async function AttendPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <SessionCheckInView token={token} />;
}
