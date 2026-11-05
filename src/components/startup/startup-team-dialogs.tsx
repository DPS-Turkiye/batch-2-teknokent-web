"use client";

import { useTranslations } from "next-intl";

import { DangerButton } from "@/components/common/danger-button";
import { fieldClass, labelClass } from "@/components/common/form-field";
import { ModalDialog } from "@/components/common/modal-dialog";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import type { useStartupTeam } from "@/hooks/use-startup-team";
import type { useTeamChanges } from "@/hooks/use-team-changes";
import type { OrganizationMember } from "@/interfaces/organization-member";
import { MemberFormMode } from "@/lib/startup-team";

type Team = ReturnType<typeof useStartupTeam>;

export function MemberFormDialog({ team }: { team: Team }) {
  const t = useTranslations("startupTeam");
  const { draft } = team;
  if (!draft) return null;
  const adding = draft.mode === MemberFormMode.Add;
  return (
    <ModalDialog labelledBy="member-form-title" onClose={team.closeForm}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void team.submitForm();
        }}
      >
        <h2 id="member-form-title" className="text-base font-semibold">
          {adding ? t("add") : t("editTitle")}
        </h2>
        <label className="block">
          <span className={labelClass}>{t("fullName")}</span>
          <input
            className={fieldClass}
            value={draft.fullName}
            maxLength={255}
            onChange={(event) => team.setField("fullName", event.target.value)}
          />
        </label>
        <label className="block">
          <span className={labelClass}>{t("email")}</span>
          <input
            className={fieldClass}
            type="email"
            value={draft.email}
            maxLength={255}
            disabled={!adding}
            onChange={(event) => team.setField("email", event.target.value)}
          />
        </label>
        <label className="block">
          <span className={labelClass}>{t("jobTitle")}</span>
          <input
            className={fieldClass}
            value={draft.jobTitle}
            maxLength={255}
            placeholder="CTO"
            onChange={(event) => team.setField("jobTitle", event.target.value)}
          />
        </label>
        {team.formError ? (
          <p role="alert" className="text-xs text-[#c24135]">
            {team.formError}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={team.closeForm}>
            {t("cancel")}
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={team.isSaving}>
            {team.isSaving ? t("saving") : adding ? t("addAction") : t("save")}
          </PrimaryButton>
        </div>
      </form>
    </ModalDialog>
  );
}

export function RemoveMemberDialog({
  asRequest,
  isRemoving,
  member,
  onCancel,
  onConfirm,
}: {
  /** In a program the coordinator decides, so the leader only asks. */
  asRequest: boolean;
  isRemoving: boolean;
  member: OrganizationMember | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("startupTeam");
  if (!member) return null;
  return (
    <ModalDialog labelledBy="member-remove-title" onClose={onCancel}>
      <h2 id="member-remove-title" className="text-base font-semibold">
        {t("removeTitle")}
      </h2>
      <p className="text-sm text-[#676e78]">
        {t(asRequest ? "removeRequestBody" : "removeBody", {
          name: member.fullName,
        })}
      </p>
      <div className="flex justify-end gap-2">
        <SecondaryButton onClick={onCancel}>{t("cancel")}</SecondaryButton>
        <DangerButton disabled={isRemoving} onClick={onConfirm}>
          {isRemoving
            ? t("removing")
            : asRequest
              ? t("changes.sendRequest")
              : t("remove")}
        </DangerButton>
      </div>
    </ModalDialog>
  );
}

type Changes = ReturnType<typeof useTeamChanges>;

/** A member's request to the coordinator, or the leader's leave with a successor. */
export function LeaveTeamDialog({ changes }: { changes: Changes }) {
  const t = useTranslations("startupTeam.changes");
  if (!changes.confirmingLeave) return null;
  const leader = changes.viewerIsLeader;
  const needsSuccessor = leader && !changes.alone;
  return (
    <ModalDialog labelledBy="team-leave-title" onClose={changes.closeLeave}>
      <h2 id="team-leave-title" className="text-base font-semibold">
        {t("leaveTitle")}
      </h2>
      <p className="text-sm text-[#676e78]">
        {!leader
          ? t("memberLeaveBody")
          : changes.alone
            ? t("aloneLeaveBody")
            : t("leaderLeaveBody")}
      </p>
      {needsSuccessor ? (
        <label className="block">
          <span className={labelClass}>{t("successor")}</span>
          <select
            className={fieldClass}
            value={changes.successorId}
            onChange={(event) => changes.setSuccessorId(event.target.value)}
          >
            <option value="">{t("successorPlaceholder")}</option>
            {changes.successors.map((member) => (
              <option key={member.id} value={member.id}>
                {member.fullName}
              </option>
            ))}
          </select>
          {changes.successors.length === 0 ? (
            <span className="mt-1 block text-xs text-[#c24135]">
              {t("noSuccessor")}
            </span>
          ) : null}
        </label>
      ) : null}
      <div className="flex justify-end gap-2">
        <SecondaryButton onClick={changes.closeLeave}>
          {t("cancel")}
        </SecondaryButton>
        <DangerButton
          disabled={
            changes.isLeaving || (needsSuccessor && !changes.successorId)
          }
          onClick={changes.confirmLeave}
        >
          {changes.isLeaving
            ? t("sending")
            : leader
              ? t("leave")
              : t("sendRequest")}
        </DangerButton>
      </div>
    </ModalDialog>
  );
}
