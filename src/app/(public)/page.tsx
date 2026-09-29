import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/landing-page";
import { LANDING_TITLE } from "@/lib/const/landing";

export const metadata: Metadata = { title: { absolute: LANDING_TITLE } };

// A prerendered landing page is cached by the CDN for every visitor alike, so
// the proxy never sees a phone to send to /m. Rendering it per request keeps it
// out of that cache.
export const dynamic = "force-dynamic";

export default function Home() {
  return <LandingPage />;
}
