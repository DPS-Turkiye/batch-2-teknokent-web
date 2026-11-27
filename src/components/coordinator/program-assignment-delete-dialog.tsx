// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";

import { AdminOverlay, OutlineButton } from "@/components/admin/admin-ui";
import type { ProgramAssignmentDelete } from "@/hooks/use-program-assignment-delete";

/** "Sil" on a program Ödev: says how many teams' files go with it before anything is deleted. */
export function ProgramAssignmentDeleteDialog({
  remove,
}: {
  remove: ProgramAssignmentDelete;
}) {
  const t = useTranslations("programAssignments");
  if (!remove.deleting) return null;
  return (
    <AdminOverlay label={t("deleteTitle")} onClose={remove.cancel}>
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-[480px] space-y-4 rounded-[28px] bg-white p-7 shadow-[0px_16px_48px_0px_rgba(33,38,43,0.14)]"
      >
        <div className="space-y-2">
          <h2 className="text-[20px] font-semibold text-[#22262b]">
            {t("deleteTitle")}
          </h2>
          <p className="text-[13.5px] text-[#22262b]">
            {t("deleteBody", { title: remove.deleting.title })}
          </p>
          <p className="text-[13px] text-[#d9464b]">
            {t("deleteFiles", { count: remove.teamsWithFiles })}
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <OutlineButton onClick={remove.cancel} disabled={remove.removing}>
            {t("cancel")}
          </OutlineButton>
          <button
            type="button"
            onClick={remove.confirm}
            disabled={remove.removing}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-[#d9464b] px-4 text-[13px] font-medium text-white disabled:opacity-50"
          >
            {remove.removing ? t("deleting") : t("deleteConfirm")}
          </button>
        </div>
      </div>
    </AdminOverlay>
  );
}
