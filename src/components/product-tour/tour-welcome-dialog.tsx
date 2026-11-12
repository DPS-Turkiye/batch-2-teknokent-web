"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useId } from "react";

import { ModalDialog } from "@/components/common/modal-dialog";
import { Button, ButtonVariant } from "@/components/ia/button";
import { TOUR_ILLUSTRATIONS } from "@/lib/product-tour";
import type { TourRole } from "@/types/product-tour";

export const TOUR_OVERLAY_CLASS =
  "fixed inset-0 z-[70] grid place-items-center bg-text-primary/55 px-4";

export const TOUR_DIALOG_CLASS =
  "flex max-h-[calc(100dvh-32px)] w-full max-w-[520px] flex-col gap-5 overflow-y-auto rounded-featured bg-background-surface p-6 shadow-modal outline-none sm:p-8";

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
  const t = useTranslations("iaTour");
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
        <h2 id={titleId} className="type-h2 text-text-primary">
          {t(`roles.${role}.welcome.title`)}
        </h2>
        <p className="type-body text-text-secondary">
          {t(`roles.${role}.welcome.body`)}
        </p>
      </div>
      <ol className="space-y-2.5">
        {OUTLINE.map((item, index) => (
          <li
            key={item}
            className="flex items-center gap-2.5 type-body-sm text-text-primary"
          >
            <span
              aria-hidden
              className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-odtu-bg type-label-sm text-brand-odtu-strong"
            >
              {index + 1}
            </span>
            {t(`roles.${role}.welcome.outline.${item}`)}
          </li>
        ))}
      </ol>
      <div className="flex items-center justify-between gap-3">
        <Button variant={ButtonVariant.Ghost} onClick={onSkip}>
          {t("welcome.later")}
        </Button>
        <Button onClick={onStart}>{t("welcome.start")}</Button>
      </div>
    </ModalDialog>
  );
}
