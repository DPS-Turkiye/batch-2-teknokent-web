import { notFound } from "next/navigation";
import { Suspense } from "react";

import { OtgCallbackView } from "@/components/login/otg-callback-view";
import { isOtgLoginEnabled } from "@/lib/otg-login";

export default function OtgCallbackPage() {
  if (!isOtgLoginEnabled()) notFound();
  return (
    <Suspense>
      <OtgCallbackView />
    </Suspense>
  );
}
