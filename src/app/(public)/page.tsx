import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/landing-page";
import { OdtuLandingPage } from "@/components/landing/odtu-landing-page";
import { Edition } from "@/interfaces/edition";
import { LANDING_TITLE } from "@/lib/const/landing";
import { appEdition } from "@/lib/server/edition";

export const metadata: Metadata = { title: { absolute: LANDING_TITLE } };

// A prerendered landing page is cached by the CDN for every visitor alike, so
// the proxy never sees a phone to send to /m. Rendering it per request keeps it
// out of that cache, and reads the deployment's edition per request too.
export const dynamic = "force-dynamic";

export default function Home() {
  return appEdition() === Edition.Odtu ? <OdtuLandingPage /> : <LandingPage />;
}
