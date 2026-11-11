"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useId } from "react";

import { ModalDialog } from "@/components/common/modal-dialog";
import {
  TourGhostButton,
  TourPrimaryButton,
} from "@/components/product-tour/tour-buttons";
import { TOUR_ILLUSTRATIONS } from "@/lib/product-tour";
import type { TourRole } from "@/types/product-tour";

export const TOUR_OVERLAY_CLASS =
  "fixed inset-0 z-[70] grid place-items-center bg-[#1c2026]/55 px-4";

export const TOUR_DIALOG_CLASS =
  "flex max-h-[calc(100dvh-32px)] w-full max-w-[520px] flex-col gap-5 overflow-y-auto rounded-[28px] bg-white p-6 shadow-[0_28px_56px_-12px_rgba(28,32,38,0.22),0_8px_16px_-4px_rgba(28,32,38,0.06)] outline-none sm:p-8";

const OUTLINE = ["first", "second", "third"] as const;

/** "İlk randevunu birlikte alalım": what the tour will show, with "Turu Başlat" and "Şimdilik Atla". */
export function TourWelcomeDialog({
  role,
  onStart,
  onSkip,
}: {
  role: TourRole;
  onStart: () => void;
  onSkip: () => void;
}) {
  const t = useTranslations("productTour");
  const titleId = useId();
  const illustration = TOUR_ILLUSTRATIONS[role];
  return (
    <ModalDialog
      labelledBy={titleId}
      onClose={onSkip}
      overlayClassName={TOUR_OVERLAY_CLASS}
      panelClassName={TOUR_DIALOG_CLASS}
    >
      <Image
        src={illustration.src}
        alt=""
        width={illustration.width}
        height={illustration.height}
        priority
        className="mx-auto h-auto w-full"
        style={{ maxWidth: illustration.width }}
      />
      <div className="space-y-2">
        <h2
          id={titleId}
          className="text-2xl leading-8 font-bold tracking-[-0.24px] text-[#1c2026]"
        >
          {t(`roles.${role}.welcome.title`)}
        </h2>
        <p className="text-sm leading-[22px] text-[#575f69]">
          {t(`roles.${role}.welcome.body`)}
        </p>
      </div>
      <ol className="space-y-2.5">
        {OUTLINE.map((item, index) => (
          <li
            key={item}
            className="flex items-center gap-2.5 text-[13px] leading-5 text-[#1c2026]"
          >
            <span
              aria-hidden
              className="grid size-6 shrink-0 place-items-center rounded-full bg-[#fdedef] text-xs font-medium text-[#d0112b]"
            >
              {index + 1}
            </span>
            {t(`roles.${role}.welcome.outline.${item}`)}
          </li>
        ))}
      </ol>
      <div className="flex items-center justify-between gap-3">
        <TourGhostButton onClick={onSkip}>{t("welcome.later")}</TourGhostButton>
        <TourPrimaryButton onClick={onStart}>
          {t("welcome.start")}
        </TourPrimaryButton>
      </div>
    </ModalDialog>
  );
}
