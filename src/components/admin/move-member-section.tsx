// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";

import { Panel } from "@/components/admin/admin-ui";
import { MoveMemberButton } from "@/components/people/move-member-dialog";
import { useOffersTeamMove } from "@/hooks/use-move-member";

/** The admin's "Takıma taşı" control under a startup member's profile; absent for anyone else. */
export function MoveMemberSection({ userId }: { userId: string }) {
  const t = useTranslations("teamMove");
  if (!useOffersTeamMove(userId)) return null;

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div className="min-w-0 space-y-1">
          <h2 className="text-[15px] font-semibold text-[#22262b]">
            {t("sectionTitle")}
          </h2>
          <p className="text-[13px] leading-[1.5] text-[#676e78]">
            {t("sectionBody")}
          </p>
        </div>
        <MoveMemberButton
          userId={userId}
          className="rounded-full border border-[#e9ecef] px-4 py-2 text-[13px] font-medium text-[#22262b] hover:bg-[#f7f8f9]"
        />
      </div>
    </Panel>
  );
}
