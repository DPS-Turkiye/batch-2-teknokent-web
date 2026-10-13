import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { MobileLoginView } from "@/components/mobile/mobile-login-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return { title: t("login") };
}

export default function MobileLoginPage() {
  return (
    <Suspense>
      <MobileLoginView />
    </Suspense>
  );
}
