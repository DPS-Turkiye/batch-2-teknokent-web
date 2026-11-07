// TEST UI: placeholder until the design team's screen; replace when it arrives.
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/common/empty-state";

export default async function StudentHomePage() {
  const t = await getTranslations("odtuWorkspaces.student");
  return <EmptyState title={t("comingTitle")} body={t("comingBody")} />;
}
