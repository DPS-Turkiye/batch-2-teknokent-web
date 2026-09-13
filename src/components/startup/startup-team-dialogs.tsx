"use client";

import { DangerButton } from "@/components/common/danger-button";
import { fieldClass, labelClass } from "@/components/common/form-field";
import { ModalDialog } from "@/components/common/modal-dialog";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import type { useStartupTeam } from "@/hooks/use-startup-team";
import type { OrganizationMember } from "@/interfaces/organization-member";
import { MemberFormMode } from "@/lib/startup-team";

type Team = ReturnType<typeof useStartupTeam>;

export function MemberFormDialog({ team }: { team: Team }) {
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
          {adding ? "Ekip üyesi ekle" : "Ekip üyesini düzenle"}
        </h2>
        <label className="block">
          <span className={labelClass}>Ad soyad</span>
          <input
            className={fieldClass}
            value={draft.fullName}
            maxLength={255}
            onChange={(event) => team.setField("fullName", event.target.value)}
          />
        </label>
        <label className="block">
          <span className={labelClass}>E-posta</span>
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
          <span className={labelClass}>Ünvan</span>
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
          <SecondaryButton onClick={team.closeForm}>Vazgeç</SecondaryButton>
          <PrimaryButton type="submit" disabled={team.isSaving}>
            {team.isSaving ? "Kaydediliyor…" : adding ? "Ekle" : "Kaydet"}
          </PrimaryButton>
        </div>
      </form>
    </ModalDialog>
  );
}

export function RemoveMemberDialog({
  isRemoving,
  member,
  onCancel,
  onConfirm,
}: {
  isRemoving: boolean;
  member: OrganizationMember | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!member) return null;
  return (
    <ModalDialog labelledBy="member-remove-title" onClose={onCancel}>
      <h2 id="member-remove-title" className="text-base font-semibold">
        Ekip üyesini çıkarmak istiyor musun?
      </h2>
      <p className="text-sm text-[#676e78]">
        {member.fullName} ekipten çıkarılır. Hesabı silinmez, yalnızca bu
        startup ile bağı kalkar.
      </p>
      <div className="flex justify-end gap-2">
        <SecondaryButton onClick={onCancel}>Vazgeç</SecondaryButton>
        <DangerButton disabled={isRemoving} onClick={onConfirm}>
          {isRemoving ? "Çıkarılıyor…" : "Çıkar"}
        </DangerButton>
      </div>
    </ModalDialog>
  );
}
