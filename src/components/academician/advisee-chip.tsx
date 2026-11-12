import { useTranslations } from "next-intl";

import { StatusBadge, StatusTone } from "@/components/ia/status-badge";

/** "Danışanın": the student is one of the academician's advisees in ODTÜ's record. */
export function AdviseeChip() {
  const t = useTranslations("iaAcademician.common");
  return <StatusBadge tone={StatusTone.Info}>{t("advisee")}</StatusBadge>;
}
