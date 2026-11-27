// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";

import {
  AdminOverlay,
  OutlineButton,
  SolidButton,
} from "@/components/admin/admin-ui";
import type { ProgramAssignmentEdit } from "@/hooks/use-program-assignment-edit";

const FIELD =
  "h-10 w-full rounded-xl border border-[#e9ecef] px-3 text-[13.5px] text-[#22262b] outline-none focus:border-[#22262b]";

/** "Düzenle" on a program Ödev: its title, description and due date. */
export function ProgramAssignmentEditDialog({
  edit,
}: {
  edit: ProgramAssignmentEdit;
}) {
  const t = useTranslations("programAssignments");
  const id = useId();
  const { draft } = edit;
  if (!edit.editing || !draft) return null;
  const describedBy = edit.problem ? `${id}-problem` : undefined;
  return (
    <AdminOverlay label={t("editTitle")} onClose={edit.cancel}>
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-[560px] rounded-[28px] bg-white p-7 shadow-[0px_16px_48px_0px_rgba(33,38,43,0.14)]"
      >
        <form
          aria-label={t("editTitle")}
          onSubmit={(event) => {
            event.preventDefault();
            edit.save();
          }}
          className="space-y-4"
        >
          <div className="space-y-1">
            <h2 className="text-[20px] font-semibold text-[#22262b]">
              {t("editTitle")}
            </h2>
            <p className="text-[13px] text-[#676e78]">{t("editHint")}</p>
          </div>
          <label className="block space-y-1.5" htmlFor={`${id}-title`}>
            <span className="text-[13px] font-medium text-[#22262b]">
              {t("fields.title")}
            </span>
            <input
              id={`${id}-title`}
              autoFocus
              aria-describedby={describedBy}
              className={FIELD}
              value={draft.title}
              onChange={(event) => edit.setField("title", event.target.value)}
            />
          </label>
          <label className="block space-y-1.5" htmlFor={`${id}-description`}>
            <span className="text-[13px] font-medium text-[#22262b]">
              {t("fields.description")}
            </span>
            <textarea
              id={`${id}-description`}
              rows={4}
              className="w-full rounded-xl border border-[#e9ecef] px-3 py-2 text-[13.5px] text-[#22262b] outline-none focus:border-[#22262b]"
              value={draft.description}
              onChange={(event) =>
                edit.setField("description", event.target.value)
              }
            />
          </label>
          <label className="block space-y-1.5" htmlFor={`${id}-due`}>
            <span className="text-[13px] font-medium text-[#22262b]">
              {t("fields.dueDate")}
            </span>
            <input
              id={`${id}-due`}
              type="date"
              min={edit.minDueDate}
              aria-describedby={describedBy}
              className={FIELD}
              value={draft.dueDate}
              onChange={(event) => edit.setField("dueDate", event.target.value)}
            />
          </label>
          {edit.problem ? (
            <p
              id={`${id}-problem`}
              role="alert"
              className="text-[13px] text-[#d9464b]"
            >
              {t(`problems.${edit.problem}`)}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <OutlineButton onClick={edit.cancel}>{t("cancel")}</OutlineButton>
            <SolidButton type="submit" disabled={!edit.canSave}>
              {edit.saving ? t("saving") : t("save")}
            </SolidButton>
          </div>
        </form>
      </div>
    </AdminOverlay>
  );
}
