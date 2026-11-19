// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useRef } from "react";

import { QueryNotice } from "@/components/admin/admin-ui";
import { ModalDialog } from "@/components/common/modal-dialog";
import type { useAttendanceQr } from "@/hooks/use-attendance-qr";

const BUTTON =
  "inline-flex h-10 items-center justify-center rounded-full border border-[#e9ecef] bg-white px-4 text-[13px] font-medium text-[#22262b] disabled:opacity-50";

/** A session's QR code, big enough to project, with its link, "Yazdır" and "Yenile". */
export function AttendanceQrDialog({
  qr,
}: {
  qr: ReturnType<typeof useAttendanceQr>;
}) {
  const t = useTranslations("programReport.attendanceQr");
  const titleId = useId();
  const confirmTextId = useId();
  const renewRef = useRef<HTMLButtonElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(false);
  const code = qr.code;

  // Focus follows the confirmation: onto "Vazgeç" when it opens, back onto "Yenile" when it closes.
  useEffect(() => {
    if (qr.confirming) keepRef.current?.focus();
    else if (wasConfirming.current) renewRef.current?.focus();
    wasConfirming.current = qr.confirming;
  }, [qr.confirming]);

  return (
    <ModalDialog
      labelledBy={titleId}
      onClose={qr.close}
      dismissOnBackdrop
      panelClassName="max-h-[95vh] w-full max-w-3xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6 text-center shadow-2xl outline-none"
    >
      <div data-print-area className="space-y-4 bg-white">
        <h2 id={titleId} className="text-[22px] font-semibold text-[#22262b]">
          {code?.heading ?? t("title")}
        </h2>
        {code ? (
          <>
            <div className="space-y-0.5 text-[15px] text-[#676e78]">
              <p className="font-medium text-[#22262b]">{code.programName}</p>
              {code.title ? <p>{code.title}</p> : null}
              <p>{code.when}</p>
              {code.window ? <p>{code.window}</p> : null}
            </div>
            <svg
              role="img"
              aria-label={t("qrLabel", { title: code.heading })}
              viewBox={`-4 -4 ${code.shape.size + 8} ${code.shape.size + 8}`}
              shapeRendering="crispEdges"
              className="mx-auto aspect-square w-full max-w-[min(70vh,560px)] bg-white"
            >
              <path d={code.shape.path} fill="#000" />
            </svg>
            <p className="text-[12.5px] break-all text-[#676e78]">
              <span className="font-medium text-[#22262b]">{t("link")}: </span>
              {code.link}
            </p>
          </>
        ) : (
          <QueryNotice isLoading={qr.isCodeLoading} error={qr.codeError} />
        )}
      </div>

      {qr.confirming ? (
        <div
          role="alertdialog"
          aria-label={t("regenerate")}
          aria-describedby={confirmTextId}
          className="space-y-3 rounded-xl border border-[#f2d4d5] bg-[#fdf5f5] p-4 print:hidden"
        >
          <p id={confirmTextId} className="text-[13.5px] text-[#22262b]">
            {t("regenerateConfirm")}
          </p>
          <div className="flex justify-center gap-2">
            <button
              ref={keepRef}
              type="button"
              onClick={qr.cancelRegenerate}
              className={BUTTON}
            >
              {t("regenerateNo")}
            </button>
            <button
              type="button"
              onClick={qr.confirmRegenerate}
              aria-disabled={qr.isRegenerating}
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#d9464b] px-4 text-[13px] font-medium text-white aria-disabled:opacity-50"
            >
              {t("regenerate")}
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap justify-center gap-2 print:hidden">
        <button
          type="button"
          onClick={qr.print}
          disabled={!code}
          className={BUTTON}
        >
          {t("print")}
        </button>
        <button
          ref={renewRef}
          type="button"
          onClick={qr.askRegenerate}
          disabled={!code}
          className={BUTTON}
        >
          {t("regenerate")}
        </button>
        <button type="button" onClick={qr.close} className={BUTTON}>
          {t("close")}
        </button>
      </div>
    </ModalDialog>
  );
}
