// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";

import { OutlineButton } from "@/components/admin/admin-ui";
import { DangerButton } from "@/components/common/danger-button";
import { ModalDialog } from "@/components/common/modal-dialog";
import { useEmailStop } from "@/hooks/use-email-stop";
import type { EmailCampaign } from "@/interfaces/email-center";

const TITLE_ID = "email-stop-title";
const LABEL_ID = "email-stop-label";

/** While a mail waits or leaves: how long it can still be taken back whole, and the way to stop it. */
export function EmailStopPanel({ campaign }: { campaign: EmailCampaign }) {
  const t = useTranslations("emailCenter");
  const stop = useEmailStop(campaign);
  if (!stop.canStop) return null;

  return (
    <div className="flex flex-col gap-3 rounded-[28px] border border-[#e9ecef] bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div>
        {stop.isHolding ? (
          <p className="text-[15px] font-semibold text-[#22262b]">
            <span id={LABEL_ID}>{t("stop.startsIn")}</span>{" "}
            <span
              role="timer"
              aria-labelledby={LABEL_ID}
              className="tabular-nums"
            >
              {stop.countdown}
            </span>
          </p>
        ) : (
          <p className="text-[15px] font-semibold text-[#22262b]">
            {t("stop.leaving")}
          </p>
        )}
        <p className="mt-1 text-[13.5px] text-[#676e78]">
          {stop.isHolding ? t("stop.holdHint") : t("stop.leavingHint")}
        </p>
      </div>
      <DangerButton disabled={stop.isStopping} onClick={stop.ask}>
        {t("stop.button")}
      </DangerButton>
      {stop.isAsking ? (
        <ModalDialog labelledBy={TITLE_ID} onClose={stop.cancel}>
          <h2
            id={TITLE_ID}
            className="text-[19px] font-semibold text-[#22262b]"
          >
            {t("stop.title")}
          </h2>
          <p className="text-[13.5px] text-[#676e78]">{t("stop.text")}</p>
          <div className="flex flex-wrap justify-end gap-2">
            <OutlineButton onClick={stop.cancel}>{t("cancel")}</OutlineButton>
            <DangerButton disabled={stop.isStopping} onClick={stop.confirm}>
              {t("stop.yes")}
            </DangerButton>
          </div>
        </ModalDialog>
      ) : null}
    </div>
  );
}
