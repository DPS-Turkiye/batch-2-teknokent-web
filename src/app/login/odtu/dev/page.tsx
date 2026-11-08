import { notFound } from "next/navigation";
import { Suspense } from "react";

import { OdtuDevLoginView } from "@/components/login/odtu-dev-login-view";
import { isOdtuDevLoginEnabled } from "@/lib/const";

export default function OdtuDevLoginPage() {
  if (!isOdtuDevLoginEnabled()) notFound();
  return (
    <Suspense>
      <OdtuDevLoginView />
    </Suspense>
  );
}
