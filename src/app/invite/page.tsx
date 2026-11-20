import { Suspense } from "react";

import { InviteView } from "@/components/auth/invite-view";

export default function InvitePage() {
  // InviteView reads ?code= and ?resume= from the URL.
  return (
    <Suspense>
      <InviteView />
    </Suspense>
  );
}
