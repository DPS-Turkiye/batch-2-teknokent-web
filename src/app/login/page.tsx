import { Suspense } from "react";

import { LoginFlowView } from "@/components/login/login-flow-view";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginFlowView />
    </Suspense>
  );
}
