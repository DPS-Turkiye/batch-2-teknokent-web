"use client";

import { useTranslations } from "next-intl";

import { WeeklyAvailabilityEditor } from "@/components/availability/weekly-availability-editor";
import { ModalDialog } from "@/components/common/modal-dialog";
import { useOfficeHoursAvailabilityForm } from "@/hooks/use-office-hours-availability";

const pillButtonClass =
  "rounded-full px-[18px] py-2.5 text-[12.5px]! font-medium! leading-[19px]!";

/** "Müsaitliği düzenle" for an academic: the shared weekly availability editor in the mentor dialog's frame. */
export function OfficeHoursAvailabilityDialog({
  onClose,
}: {
  onClose: () => void;
}) {
  const t = useTranslations("officeHours.availability");
  const availability = useOfficeHoursAvailabilityForm(onClose);

  return (
    <ModalDialog
      labelledBy="office-hours-availability-title"
      onClose={onClose}
      panelClassName="flex max-h-[92vh] w-full max-w-[620px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_16px_48px_rgba(0,0,0,0.18)] outline-none"
    >
      <header className="flex items-center justify-between gap-4 border-b border-[#eceef0] px-6 pb-4 pt-5">
        <div className="flex min-w-0 flex-col gap-[3px]">
          <h2
            id="office-hours-availability-title"
            className="text-[19px] font-semibold leading-[29px] text-[#22262b]"
          >
            {t("title")}
          </h2>
          <p className="text-[12.5px] leading-[19px] text-[#676e78]">
            {t("subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-[#676e78] hover:text-[#22262b]"
        >
          {t("close")}
        </button>
      </header>

      <WeeklyAvailabilityEditor
        editor={availability}
        className="flex-1 overflow-y-auto px-6 py-5"
      />

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eceef0] px-6 pb-5 pt-4">
        <p className="text-xs text-[#858c96]">{t("footer")}</p>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className={`${pillButtonClass} border border-[#d4d8dd] bg-white text-[#4a5059]`}
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={() => void availability.save()}
            disabled={!availability.draft || availability.isSaving}
            className={`${pillButtonClass} bg-[#e86f22] text-white disabled:opacity-50`}
          >
            {availability.isSaving ? t("saving") : t("save")}
          </button>
        </div>
      </footer>
    </ModalDialog>
  );
}
