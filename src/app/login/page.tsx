import { connection } from "next/server";
import { Suspense } from "react";

import { LoginFlowView } from "@/components/login/login-flow-view";
import { appEdition } from "@/lib/server/edition";

export default async function LoginPage() {
  // Read per request: a prerendered page would freeze the edition the build ran with.
  await connection();
  return (
    <Suspense>
      <LoginFlowView edition={appEdition()} />
    </Suspense>
  );
}
