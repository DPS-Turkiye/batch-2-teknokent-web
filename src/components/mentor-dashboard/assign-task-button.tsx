"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";

import { ModalDialog } from "@/components/common/modal-dialog";
import { useMentorTaskAssignment } from "@/hooks/use-mentor-task-assignment";

export function AssignTaskButton({
  requestId,
  startupName,
}: {
  requestId: string;
  startupName: string;
}) {
  const t = useTranslations("mentorHome.assignTask");
  const titleId = useId();
  const form = useMentorTaskAssignment(requestId);
  const fieldClass =
    "mt-1 w-full rounded-xl border border-[#d4d8dd] px-3 py-2 text-sm text-[#22262b]";
  return (
    <>
      <button
        type="button"
        onClick={form.open}
        className="font-medium text-[#1876b8]"
      >
        {t("open")}
      </button>
      {form.isOpen ? (
        <ModalDialog labelledBy={titleId} onClose={form.close}>
          <h2 id={titleId} className="text-lg font-semibold text-[#22262b]">
            {t("title")}
          </h2>
          <p className="text-sm text-[#676e78]">{startupName}</p>
          <form onSubmit={form.submit} className="space-y-4">
            <label className="block text-sm font-medium">
              {t("taskTitle")}
              <input
                className={fieldClass}
                value={form.title}
                onChange={(event) => form.setTitle(event.target.value)}
                maxLength={255}
                required
                disabled={form.isSaving}
              />
            </label>
            <label className="block text-sm font-medium">
              {t("assignee")}
              <select
                className={fieldClass}
                value={form.ownerId}
                onChange={(event) => form.setOwnerId(event.target.value)}
                required
                disabled={form.isLoading || form.isLoadError || form.isSaving}
              >
                <option value="">{t("chooseAssignee")}</option>
                {form.assignees.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.fullName}
                  </option>
                ))}
              </select>
            </label>
            {form.isLoading ? (
              <p role="status" className="text-sm text-[#676e78]">
                {t("loading")}
              </p>
            ) : null}
            {form.isLoadError ? (
              <div role="alert" className="text-sm text-[#b42318]">
                {t("loadFailed")}{" "}
                <button
                  type="button"
                  onClick={() => void form.retry()}
                  className="underline"
                >
                  {t("retry")}
                </button>
              </div>
            ) : null}
            {!form.isLoading &&
            !form.isLoadError &&
            form.assignees.length === 0 ? (
              <p className="text-sm text-[#676e78]">{t("noAssignees")}</p>
            ) : null}
            <label className="block text-sm font-medium">
              {t("description")}
              <textarea
                className={fieldClass}
                rows={3}
                maxLength={10000}
                value={form.description}
                onChange={(event) => form.setDescription(event.target.value)}
                disabled={form.isSaving}
              />
            </label>
            <label className="block text-sm font-medium">
              {t("dueDate")}
              <input
                className={fieldClass}
                type="date"
                value={form.dueDate}
                onChange={(event) => form.setDueDate(event.target.value)}
                disabled={form.isSaving}
              />
            </label>
            {form.error ? (
              <p role="alert" className="text-sm text-[#b42318]">
                {form.error}
              </p>
            ) : null}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={form.close}
                disabled={form.isSaving}
                className="rounded-full border border-[#d4d8dd] px-4 py-2 text-sm"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                disabled={!form.canSubmit}
                className="rounded-full bg-[#1876b8] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {form.isSaving ? t("saving") : t("save")}
              </button>
            </div>
          </form>
        </ModalDialog>
      ) : null}
    </>
  );
}
