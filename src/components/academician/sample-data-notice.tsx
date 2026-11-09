// TEST UI: placeholder until the design team's screen; replace when it arrives.
import { useTranslations } from "next-intl";

/** Marks a screen whose Office Hours data is sample data until a source is connected. */
export function SampleDataNotice() {
  const t = useTranslations("academicianWorkspace");
  return (
    <p
      role="note"
      className="rounded-xl border border-[#f3d9b8] bg-[#fff8ef] px-4 py-3 text-sm text-[#8a5a1c]"
    >
      {t("sampleNotice")}
    </p>
  );
}
