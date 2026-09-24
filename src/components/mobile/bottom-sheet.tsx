"use client";

import type { ReactNode } from "react";

import { ModalDialog } from "@/components/common/modal-dialog";

const OVERLAY_CLASS =
  "fixed inset-0 z-[60] flex items-end justify-center bg-[rgba(34,38,43,0.36)]";

const PANEL_CLASS =
  "flex w-full max-w-[480px] flex-col gap-5 rounded-t-[28px] bg-white px-5 pt-2.5 pb-[calc(34px+env(safe-area-inset-bottom))] shadow-[0px_-8px_40px_0px_rgba(33,38,43,0.16)] outline-none";

export function BottomSheet({
  labelledBy,
  onClose,
  children,
}: {
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <ModalDialog
      labelledBy={labelledBy}
      onClose={onClose}
      overlayClassName={OVERLAY_CLASS}
      panelClassName={PANEL_CLASS}
    >
      <div className="flex justify-center" aria-hidden="true">
        <span className="h-[5px] w-10 rounded-[3px] bg-[#d5d9de]" />
      </div>
      {children}
    </ModalDialog>
  );
}
