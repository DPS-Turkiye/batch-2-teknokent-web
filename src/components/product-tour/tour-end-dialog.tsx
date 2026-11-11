"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";

import { ModalDialog } from "@/components/common/modal-dialog";
import { Button } from "@/components/ia/button";
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
  const t = useTranslations("iaTour");
  const titleId = useId();
  return (
    <ModalDialog
      labelledBy={titleId}
      onClose={onClose}
      overlayClassName={TOUR_OVERLAY_CLASS}
      panelClassName={TOUR_DIALOG_CLASS}
    >
      <div className="space-y-2">
        <h2 id={titleId} className="type-h2 text-text-primary">
          {t("end.title")}
        </h2>
        <p className="type-body text-text-secondary">
          {t(`roles.${role}.end.body`)}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[220px] type-caption text-text-muted">
          {t(`roles.${role}.end.replayHint`)}
        </p>
        <Button onClick={onExit}>{t(`roles.${role}.end.exit`)}</Button>
      </div>
    </ModalDialog>
  );
}
