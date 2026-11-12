import { useTranslations } from "next-intl";

import { InlineAlert } from "@/components/ia/inline-alert";
import { StatusTone } from "@/components/ia/status-badge";

/** Marks a screen whose Office Hours data is sample data until a source is connected (FR-OH-12/13). */
export function SampleDataNotice() {
  const t = useTranslations("iaAcademician.common");
  return (
    <InlineAlert tone={StatusTone.Neutral}>{t("sampleNotice")}</InlineAlert>
  );
}
