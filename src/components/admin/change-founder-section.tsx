// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";

import { Panel } from "@/components/admin/admin-ui";
import { ChangeFounderButton } from "@/components/people/change-founder-dialog";
import { useFounderChangeStartup } from "@/hooks/use-change-founder";

/** The admin's "Kurucuyu değiştir" control under a startup member's profile, for that person's startup. */
export function ChangeFounderSection({ userId }: { userId: string }) {
  const t = useTranslations("founderChange");
  const startup = useFounderChangeStartup(userId);
  if (!startup) return null;

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div className="min-w-0 space-y-1">
          <h2 className="text-[15px] font-semibold text-[#22262b]">
            {t("sectionTitle")}
          </h2>
          <p className="text-[13px] leading-[1.5] text-[#676e78]">
            {t("sectionBody", { team: startup.name })}
          </p>
        </div>
        <ChangeFounderButton
          organizationId={startup.id}
          className="rounded-full border border-[#e9ecef] px-4 py-2 text-[13px] font-medium text-[#22262b] hover:bg-[#f7f8f9]"
        />
      </div>
    </Panel>
  );
}
