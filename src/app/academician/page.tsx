// TEST UI: placeholder until the design team's screen; replace when it arrives.
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/common/empty-state";

export default async function AcademicianHomePage() {
  const t = await getTranslations("odtuWorkspaces.academician");
  return (
    <EmptyState accent="blue" title={t("comingTitle")} body={t("comingBody")} />
  );
}
