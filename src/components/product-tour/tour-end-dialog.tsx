"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";

import { ModalDialog } from "@/components/common/modal-dialog";
import { TourPrimaryButton } from "@/components/product-tour/tour-buttons";
import {
  TOUR_DIALOG_CLASS,
  TOUR_OVERLAY_CLASS,
} from "@/components/product-tour/tour-welcome-dialog";
import type { TourRole } from "@/types/product-tour";

/** "Hazırsın!": where to find things next, and where the tour can be watched again. */
export function TourEndDialog({
  role,
  onClose,
  onExit,
}: {
  role: TourRole;
  onClose: () => void;
  onExit: () => void;
}) {
  const t = useTranslations("productTour");
  const titleId = useId();
  return (
    <ModalDialog
      labelledBy={titleId}
      onClose={onClose}
      overlayClassName={TOUR_OVERLAY_CLASS}
      panelClassName={TOUR_DIALOG_CLASS}
    >
      <div className="space-y-2">
        <h2
          id={titleId}
          className="text-2xl leading-8 font-bold tracking-[-0.24px] text-[#1c2026]"
        >
          {t("end.title")}
        </h2>
        <p className="text-sm leading-[22px] text-[#575f69]">
          {t(`roles.${role}.end.body`)}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[220px] text-xs leading-4 text-[#6e7681]">
          {t(`roles.${role}.end.replayHint`)}
        </p>
        <TourPrimaryButton onClick={onExit}>
          {t(`roles.${role}.end.exit`)}
        </TourPrimaryButton>
      </div>
    </ModalDialog>
  );
}
