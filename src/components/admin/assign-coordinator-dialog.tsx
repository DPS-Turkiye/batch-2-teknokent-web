"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.
import { useTranslations } from "next-intl";

import { AdminOverlay } from "@/components/admin/admin-ui";
import { CoordinatorPicker } from "@/components/admin/coordinator-picker";
import { useAssignProgramCoordinator } from "@/hooks/use-admin-coordinators";
import { NO_COORDINATOR_CHOICES } from "@/lib/coordinator-picker";

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

  return (
    <AdminOverlay label={t("assignTitle")} onClose={assign.close}>
      {/* The overlay closes on a click outside; a click inside must not reach it. */}
      <div
        className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_16px_48px_rgba(33,38,43,0.14)]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-[18px] font-semibold text-[#22262b]">
          {t("assignTitle")}
        </h2>
        <p className="mt-2 mb-4 text-[13.5px] leading-[1.5] text-[#676e78]">
          {t("assignBody", { program: programName })}
        </p>
        <CoordinatorPicker
          chosen={NO_COORDINATOR_CHOICES}
          onChange={assign.pick}
          programId={programId}
          disabled={assign.adding}
        />
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={assign.close}
            disabled={assign.adding}
            className="rounded-full border border-[#e9ecef] px-5 py-[11px] text-[13.5px] font-medium text-[#22262b] disabled:text-[#aeb4bc]"
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    </AdminOverlay>
  );
}
