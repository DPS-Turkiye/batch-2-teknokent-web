// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { Check, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";

import { ModalDialog } from "@/components/common/modal-dialog";
import { MentorLabelChip } from "@/components/mentor-labels/mentor-label-chips";
import { useMentorLabelEditor } from "@/hooks/use-mentor-labels";
import {
  MentorLabelColor,
  type MentorLabelBoard,
} from "@/interfaces/mentor-label";
import { MENTOR_LABEL_PALETTE } from "@/lib/const/mentor-labels";

const PANEL =
  "max-h-[90dvh] w-full max-w-lg space-y-5 overflow-y-auto rounded-[28px] bg-white p-6 shadow-[0_16px_48px_rgba(33,38,43,0.14)] outline-none";

/** Pick a pool mentor's labels, and keep the program's list: create, rename, recolor or delete a label. */
export function MentorLabelEditor({
  programId,
  mentorId,
  mentorName,
  board,
  onClose,
}: {
  programId: string;
  mentorId: string;
  mentorName: string;
  board: MentorLabelBoard;
  onClose: () => void;
}) {
  const t = useTranslations("mentorLabels");
  const titleId = useId();
  const nameId = useId();
  const problemId = useId();
  const editor = useMentorLabelEditor({ programId, mentorId, board, onClose });

  if (editor.confirmingDelete) {
    const label = editor.confirmingDelete;
    return (
      <ModalDialog
        key="confirm-delete"
        labelledBy={titleId}
        onClose={editor.cancelDelete}
        panelClassName={PANEL}
      >
        <h2 id={titleId} className="text-[18px] font-semibold text-[#22262b]">
          {t("deleteTitle")}
        </h2>
        <p className="text-[13.5px] leading-[1.5] text-[#676e78]">
          {t("deleteBody", { name: label.name, count: label.mentorCount })}
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={editor.cancelDelete}
            className="rounded-full px-4 py-2.5 text-[13px] text-[#22262b]"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={editor.confirmDelete}
            disabled={editor.deleting}
            className="rounded-full bg-[#a1241d] px-4 py-2.5 text-[13px] font-medium text-white disabled:bg-[#aeb4bc]"
          >
            {editor.deleting ? t("deleting") : t("deleteConfirm")}
          </button>
        </div>
      </ModalDialog>
    );
  }

  return (
    <ModalDialog
      key="labels"
      labelledBy={titleId}
      onClose={onClose}
      panelClassName={PANEL}
    >
      <div>
        <h2 id={titleId} className="text-[18px] font-semibold text-[#22262b]">
          {t("dialogTitle", { name: mentorName })}
        </h2>
        <p className="mt-1.5 text-[13px] leading-[1.5] text-[#676e78]">
          {t("dialogHint", { max: editor.maxLabels })}
        </p>
      </div>

      {editor.labels.length === 0 ? (
        <p className="rounded-2xl bg-[#f8f9fa] px-4 py-3 text-[13px] text-[#676e78]">
          {t("empty")}
        </p>
      ) : (
        <div>
          <p className="text-[12.5px] text-[#676e78]" aria-live="polite">
            {t("selectedCount", {
              count: editor.selected.length,
              max: editor.maxLabels,
            })}
            {editor.limitReached
              ? ` · ${t("limitReached", { max: editor.maxLabels })}`
              : null}
          </p>
          <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
            {editor.labels.map((label) => {
              const checked = editor.isSelected(label.id);
              return (
                <li
                  key={label.id}
                  className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-[#f5f6f8]"
                >
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!checked && editor.limitReached}
                      onChange={() => editor.toggle(label.id)}
                      className="size-4 accent-[#22262b]"
                    />
                    <MentorLabelChip label={label} />
                  </label>
                  <button
                    type="button"
                    onClick={() => editor.startEdit(label)}
                    aria-label={t("editLabel", { name: label.name })}
                    className="grid size-8 place-items-center rounded-full text-[#676e78] hover:bg-white hover:text-[#22262b]"
                  >
                    <Pencil aria-hidden className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.askDelete(label)}
                    aria-label={t("deleteLabel", { name: label.name })}
                    className="grid size-8 place-items-center rounded-full text-[#676e78] hover:bg-white hover:text-[#a1241d]"
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <form
        className="space-y-3 rounded-2xl border border-[#e9ecef] p-4"
        onSubmit={(event) => {
          event.preventDefault();
          editor.submitForm();
        }}
      >
        <p className="text-[13px] font-semibold text-[#22262b]">
          {editor.editingLabel ? t("editTitle") : t("newLabel")}
        </p>
        <div>
          <div className="flex items-baseline justify-between">
            <label
              htmlFor={nameId}
              className="text-[12.5px] font-medium text-[#676e78]"
            >
              {t("name")}
            </label>
            <span className="text-[11.5px] text-[#858c96]">
              {t("charCount", {
                count: editor.nameLength,
                max: editor.nameMax,
              })}
            </span>
          </div>
          <input
            id={nameId}
            value={editor.form.name}
            onChange={(event) => editor.setName(event.target.value)}
            placeholder={t("namePlaceholder")}
            aria-invalid={editor.problem !== null}
            aria-describedby={editor.problem ? problemId : undefined}
            className="mt-1.5 h-10 w-full rounded-xl border border-[#e9ecef] px-3 text-[13.5px] text-[#22262b] outline-none focus:border-[#22262b]"
          />
          {editor.problem ? (
            <p
              id={problemId}
              role="alert"
              className="mt-1.5 text-[12.5px] text-[#a1241d]"
            >
              {t(`problems.${editor.problem}`, { max: editor.nameMax })}
            </p>
          ) : null}
        </div>
        <fieldset>
          <legend className="text-[12.5px] font-medium text-[#676e78]">
            {t("color")}
          </legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {Object.values(MentorLabelColor).map((color) => {
              const active = editor.form.color === color;
              return (
                <button
                  key={color}
                  type="button"
                  aria-pressed={active}
                  aria-label={t(`colors.${color}`)}
                  title={t(`colors.${color}`)}
                  onClick={() => editor.setColor(color)}
                  className={`grid size-7 place-items-center rounded-full ${MENTOR_LABEL_PALETTE[color].swatch} ${
                    active ? "ring-2 ring-[#22262b] ring-offset-2" : ""
                  }`}
                >
                  {active ? (
                    <Check aria-hidden className="size-4 text-white" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="flex justify-end gap-2">
          {editor.editingLabel ? (
            <button
              type="button"
              onClick={editor.cancelEdit}
              className="rounded-full px-4 py-2 text-[13px] text-[#22262b]"
            >
              {t("cancel")}
            </button>
          ) : null}
          <button
            type="submit"
            disabled={editor.submitting}
            className="rounded-full border border-[#22262b] px-4 py-2 text-[13px] font-medium text-[#22262b] disabled:border-[#aeb4bc] disabled:text-[#aeb4bc]"
          >
            {editor.editingLabel
              ? editor.submitting
                ? t("saving")
                : t("save")
              : editor.submitting
                ? t("creating")
                : t("create")}
          </button>
        </div>
      </form>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-4 py-2.5 text-[13px] text-[#22262b]"
        >
          {t("cancel")}
        </button>
        <button
          type="button"
          onClick={editor.save}
          disabled={editor.saving}
          className="rounded-full bg-[#22262b] px-4 py-2.5 text-[13px] font-medium text-white disabled:bg-[#aeb4bc]"
        >
          {editor.saving ? t("saving") : t("save")}
        </button>
      </div>
    </ModalDialog>
  );
}
