import { getTranslations } from "next-intl/server";

import { OfficeHoursFrame } from "@/components/office-hours/office-hours-frame";
import { LtiLaunchError } from "@/interfaces/office-hours";
import { isLtiLaunchError } from "@/lib/lti";

export async function generateMetadata() {
  const t = await getTranslations("officeHours");
  return { title: t("title") };
}

/** Why office hours did not open, with the one thing the person can do about it: start again from Moodle. */
export default async function OfficeHoursLaunchErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const error = isLtiLaunchError(reason) ? reason : LtiLaunchError.Unavailable;
  const t = await getTranslations("officeHours.launchError");
  const tOfficeHours = await getTranslations("officeHours");

  return (
    <OfficeHoursFrame productName={tOfficeHours("title")}>
      <section className="rounded-2xl border border-[#e4e7ea] bg-white p-6">
        <h1 className="text-xl font-semibold text-[#22262b]">
          {t(`${error}.title`)}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#4a5059]">
          {t(`${error}.body`)}
        </p>
        <p className="mt-4 text-sm leading-6 text-[#4a5059]">{t("again")}</p>
      </section>
    </OfficeHoursFrame>
  );
}
