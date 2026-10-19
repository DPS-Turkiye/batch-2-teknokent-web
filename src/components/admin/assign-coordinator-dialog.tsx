"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { CoordinatorEmailFields } from "@/components/admin/add-coordinator-dialog";
import { AdminOverlay } from "@/components/admin/admin-ui";
import {
  useAddCoordinatorForm,
  useAssignProgramCoordinator,
} from "@/hooks/use-admin-coordinators";

export function AssignCoordinatorDialog({
  programId,
  programName,
  onClose,
}: {
  programId: string;
  programName: string;
  onClose: () => void;
}) {
  const t = useTranslations("adminCoordinators");
  const assign = useAssignProgramCoordinator(programId, onClose);
  const invite = useAddCoordinatorForm(onClose, programId);
  const [emailChosen, setEmailChosen] = useState(false);
  const noCandidates =
    !assign.isLoading && !assign.loadError && assign.candidates.length === 0;
  const byEmail = emailChosen || noCandidates;
  const canSave = byEmail ? invite.canSave : assign.canSave;
  const saving = byEmail ? invite.saving : assign.saving;

  return (
    <AdminOverlay label={t("assignTitle")} onClose={onClose}>
      <form
        aria-label={t("assignTitle")}
        className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_16px_48px_rgba(33,38,43,0.14)]"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSave) return;
          if (byEmail) invite.save();
          else assign.save();
        }}
      >
        <h2 className="text-[18px] font-semibold text-[#22262b]">
          {t("assignTitle")}
        </h2>
        <p className="mt-2 text-[13.5px] leading-[1.5] text-[#676e78]">
          {t("assignBody", { program: programName })}
        </p>

        {byEmail ? (
          <>
            <p className="mt-4 text-[13px] leading-[1.5] text-[#676e78]">
              {noCandidates ? t("noCandidates") : t("byEmailHint")}
            </p>
            <CoordinatorEmailFields form={invite} />
            {noCandidates ? null : (
              <button
                type="button"
                onClick={() => setEmailChosen(false)}
                className="text-[13px] font-medium text-[#22262b] underline"
              >
                {t("pickFromList")}
              </button>
            )}
          </>
        ) : (
          <div className="mt-5 text-[13px]">
            {assign.isLoading ? (
              <p className="text-[#858c96]">{t("loading")}</p>
            ) : assign.loadError ? (
              <p className="text-[#d9464b]">{assign.loadError.message}</p>
            ) : (
              <div className="max-h-[300px] space-y-2 overflow-y-auto">
                {assign.candidates.map((candidate) => (
                  <label
                    key={candidate.id}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#e9ecef] px-4 py-3 text-[13.5px] text-[#22262b] has-[:checked]:border-[#22262b]"
                  >
                    <input
                      type="radio"
                      name="coordinator"
                      checked={assign.selectedId === candidate.id}
                      onChange={() => assign.select(candidate.id)}
                      className="accent-[#22262b]"
                    />
                    {candidate.fullName}
                  </label>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setEmailChosen(true)}
              className="mt-3 font-medium text-[#22262b] underline"
            >
              {t("notListed")}
            </button>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#e9ecef] px-5 py-[11px] text-[13.5px] font-medium text-[#22262b]"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="rounded-full bg-[#22262b] px-5 py-[11px] text-[13.5px] font-medium text-white disabled:bg-[#aeb4bc]"
          >
            {saving ? t("adding") : t("addToProgram")}
          </button>
        </div>
      </form>
    </AdminOverlay>
  );
}
