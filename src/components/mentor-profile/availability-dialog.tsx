"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";

import { WeeklyAvailabilityEditor } from "@/components/availability/weekly-availability-editor";
import { ModalDialog } from "@/components/common/modal-dialog";
import { useAvailabilitySettingsForm } from "@/hooks/use-mentor-profile";

// globals.css gives buttons `font: inherit` outside any layer, so their type
// sizes need `!` to take effect.
const pillButtonClass =
  "rounded-full px-[18px] py-2.5 text-[12.5px]! font-medium! leading-[19px]!";

export function AvailabilityDialog({ onClose }: { onClose: () => void }) {
  const t = useTranslations("mentorProfile.dialog");
  const availability = useAvailabilitySettingsForm(onClose);
  const { draft } = availability;

  return (
    <ModalDialog
      labelledBy="availability-title"
      onClose={onClose}
      panelClassName="flex max-h-[92vh] w-full max-w-[620px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_16px_48px_rgba(0,0,0,0.18)] outline-none"
    >
      <header className="flex items-center justify-between gap-4 border-b border-[#eceef0] px-6 pb-4 pt-5">
        <div className="flex min-w-0 flex-col gap-[3px]">
          <h2
            id="availability-title"
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
          aria-label={t("close")}
          className="grid size-5 shrink-0 place-items-center"
        >
          <Image
            src="/mentor-profile/close.svg"
            alt=""
            width={20}
            height={20}
          />
        </button>
      </header>

      <WeeklyAvailabilityEditor
        editor={availability}
        className="flex-1 overflow-y-auto px-6 py-5"
      />

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eceef0] px-6 pb-5 pt-4">
        <p className="text-xs leading-[18px] text-[#676e78]">{t("footer")}</p>
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
            disabled={!draft || availability.isSaving}
            className={`${pillButtonClass} bg-[#26a4ff] text-white disabled:opacity-50`}
          >
            {availability.isSaving ? t("saving") : t("save")}
          </button>
        </div>
      </footer>
    </ModalDialog>
  );
}
