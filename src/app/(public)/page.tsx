import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/landing-page";
import { LANDING_TITLE } from "@/lib/const/landing";

export const metadata: Metadata = { title: { absolute: LANDING_TITLE } };

export default function Home() {
  return <LandingPage />;
}
