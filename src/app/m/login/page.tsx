import type { Metadata } from "next";
import { Suspense } from "react";

import { MobileLoginView } from "@/components/mobile/mobile-login-view";

export const metadata: Metadata = { title: "Giriş" };

export default function MobileLoginPage() {
  return (
    <Suspense>
      <MobileLoginView />
    </Suspense>
  );
}
