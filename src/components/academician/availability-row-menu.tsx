"use client";

import { MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";

import { useRowMenu } from "@/hooks/use-row-menu";

/** "⋯" on an availability row: edit it, or delete it after a confirmation. */
export function AvailabilityRowMenu({
  itemLabel,
  onEdit,
  onRemove,
  disabled,
}: {
  itemLabel: string;
  onEdit: () => void;
  onRemove: () => void;
  disabled: boolean;
}) {
  const t = useTranslations("iaAcademician.availability.menu");
  const { menu, rootRef, buttonRef } = useRowMenu();
  const panelId = useId();
  const itemClass =
    "block w-full rounded-lg px-3 py-2 text-left type-body-sm hover:bg-background-subtle focus-visible:outline-2 focus-visible:outline-border-selected";
  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={t("label", { item: itemLabel })}
        aria-expanded={menu.open}
        aria-controls={panelId}
        disabled={disabled}
        onClick={menu.toggle}
        className="grid size-8 place-items-center rounded-lg text-icon-default hover:bg-background-subtle focus-visible:outline-2 focus-visible:outline-border-selected disabled:opacity-50"
      >
        <MoreHorizontal aria-hidden className="size-4" />
      </button>
      {menu.open ? (
        <div
          id={panelId}
          className="absolute right-0 z-30 mt-1 w-48 rounded-2xl border border-border-default bg-background-surface p-1.5 shadow-raised"
        >
          {menu.confirming ? (
            <div className="space-y-2 p-2">
              <p className="type-label text-text-primary">{t("confirm")}</p>
              <button
                type="button"
                onClick={() => {
                  menu.close();
                  onRemove();
                }}
                className={`${itemClass} text-status-error-text`}
              >
                {t("confirmYes")}
              </button>
              <button type="button" onClick={menu.close} className={itemClass}>
                {t("confirmNo")}
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  menu.close();
                  onEdit();
                }}
                className={itemClass}
              >
                {t("edit")}
              </button>
              <button
                type="button"
                onClick={menu.askToConfirm}
                className={`${itemClass} text-status-error-text`}
              >
                {t("remove")}
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
