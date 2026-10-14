"use client";

import { useTranslations } from "next-intl";

import { EmptyNote } from "@/components/admin/admin-ui";
import { useTeamStage } from "@/hooks/use-team-stage";
import type { StartupStage } from "@/interfaces/startup-process";

const pillClass =
  "rounded-full px-4 py-2 text-[12.5px] font-medium disabled:opacity-50";

/** The team's Süreç stage in the Takımlar drawer; founders only see it on their own Süreç page. */
export function TeamStage({
  programId,
  organizationId,
}: {
  programId: string;
  organizationId: string;
}) {
  const t = useTranslations("programTeams.stage");
  const stage = useTeamStage(programId, organizationId);

  if (stage.isLoading) return <EmptyNote>{t("loading")}</EmptyNote>;
  if (stage.loadFailed) return <EmptyNote>{t("loadFailed")}</EmptyNote>;

  return (
    <div className="rounded-2xl border border-[#e9ecef] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[15px] font-semibold text-[#22262b]">
          {stage.currentLabel ?? t("none")}
        </p>
        {stage.isEditing ? null : (
          <button
            type="button"
            onClick={stage.startEditing}
            className={`${pillClass} border border-[#e9ecef] text-[#22262b]`}
          >
            {t("update")}
          </button>
        )}
      </div>
      {stage.isEditing ? (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-[12px] text-[#676e78]">
            {t("newStage")}
            <select
              value={stage.draft ?? ""}
              onChange={(event) =>
                stage.pick(event.target.value as StartupStage)
              }
              className="rounded-xl border border-[#e9ecef] px-3 py-2 text-[13px] text-[#22262b]"
            >
              {stage.options.map((option) => (
                <option key={option.stage} value={option.stage}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={stage.cancelEditing}
            className={`${pillClass} text-[#676e78]`}
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={stage.save}
            disabled={!stage.canSave}
            className={`${pillClass} bg-[#22262b] text-white`}
          >
            {stage.isSaving ? t("saving") : t("save")}
          </button>
        </div>
      ) : null}
      {stage.saveFailed ? (
        <p role="alert" className="mt-2 text-[12.5px] text-[#d9464b]">
          {t("saveFailed")}
        </p>
      ) : null}
    </div>
  );
}
