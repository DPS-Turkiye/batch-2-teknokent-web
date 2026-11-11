// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId } from "react";

import { GateBadgeStateChip } from "@/components/badges/gate-badge-state-chip";
import { ModalDialog } from "@/components/common/modal-dialog";
import { ProgramDetailFrame } from "@/components/coordinator/program-detail-frame";
import { useProgramBadges } from "@/hooks/use-program-badges";
import {
  GateBadgeState,
  inTraining,
  type GateBadgeRow,
} from "@/interfaces/badges";
import { ProgramTab } from "@/lib/coordinator-program-detail";
import { errorMessage, formatLongDate } from "@/lib/utils";

/**
 * Katılımcılar of a peer program. Öğrenciler lists the program's students with their Akran Mentoru badge;
 * Akran Mentorları only those holding it. The coordinator (or an admin) awards and takes back the badge here.
 */
export function PeerParticipantsView({
  programId,
  tab,
}: {
  programId: string;
  tab: ProgramTab.Students | ProgramTab.PeerMentors;
}) {
  return (
    <ProgramDetailFrame programId={programId} tab={tab}>
      {() => <PeerParticipantsTable programId={programId} tab={tab} />}
    </ProgramDetailFrame>
  );
}

function PeerParticipantsTable({
  programId,
  tab,
}: {
  programId: string;
  tab: ProgramTab.Students | ProgramTab.PeerMentors;
}) {
  const t = useTranslations("peerParticipants");
  const locale = useLocale();
  const badges = useProgramBadges(
    programId,
    tab === ProgramTab.PeerMentors ? GateBadgeState.Active : null,
  );

  if (badges.isLoading) {
    return (
      <p role="status" className="text-sm text-[#676e78]">
        {t("loading")}
      </p>
    );
  }
  if (badges.loadError) {
    return (
      <p role="alert" className="text-sm text-red-700">
        {errorMessage(badges.loadError, t("loadFailed"))}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {badges.actionError ? (
        <p role="alert" className="text-sm text-red-700">
          {errorMessage(badges.actionError, t("actionFailed"))}
        </p>
      ) : null}
      {badges.rows.length === 0 ? (
        <p className="text-sm text-[#676e78]">
          {tab === ProgramTab.PeerMentors ? t("noMentors") : t("noStudents")}
        </p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-[#858c96]">
            <tr>
              <th className="py-2 font-medium">{t("name")}</th>
              <th className="py-2 font-medium">{t("badge")}</th>
              <th className="py-2 font-medium">{t("since")}</th>
              <th className="py-2 font-medium">
                <span className="sr-only">{t("actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {badges.rows.map((row) => (
              <tr key={row.userId} className="border-t border-[#eceef0]">
                <td className="py-3">
                  <p className="font-medium text-[#22262b]">{row.fullName}</p>
                  <p className="text-xs text-[#858c96]">{row.email}</p>
                </td>
                <td className="py-3">
                  <GateBadgeStateChip
                    state={row.state}
                    inTraining={inTraining(row)}
                  />
                  {inTraining(row) ? (
                    <p className="mt-1 text-xs text-[#676e78]">
                      {row.training.attempts > 0
                        ? t("trainingAttempts", {
                            count: row.training.attempts,
                            best: row.training.bestScore ?? 0,
                          })
                        : t("trainingWatched")}
                    </p>
                  ) : null}
                  {row.state === GateBadgeState.Revoked && row.reason ? (
                    <p className="mt-1 text-xs text-[#b94f12]">
                      {t("revokedBecause", { reason: row.reason })}
                    </p>
                  ) : null}
                </td>
                <td className="py-3 text-xs text-[#676e78]">
                  {row.awardedAt ? formatLongDate(row.awardedAt, locale) : "—"}
                </td>
                <td className="py-3 text-right">
                  {row.state === GateBadgeState.Active ? (
                    <button
                      type="button"
                      onClick={() => badges.startRevoke(row)}
                      className="rounded-full border border-[#e4e7ea] px-3 py-1.5 text-xs font-medium text-[#b94f12]"
                    >
                      {t("revoke")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={badges.awardingUserId === row.userId}
                      onClick={() => badges.award(row.userId)}
                      className="rounded-full bg-[#22262b] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                    >
                      {t("award")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {badges.revoking ? (
        <RevokeDialog
          row={badges.revoking}
          reason={badges.reason}
          onReasonChange={badges.setReason}
          canConfirm={badges.canConfirmRevoke}
          onConfirm={badges.confirmRevoke}
          onClose={badges.cancelRevoke}
        />
      ) : null}
    </div>
  );
}

function RevokeDialog({
  row,
  reason,
  onReasonChange,
  canConfirm,
  onConfirm,
  onClose,
}: {
  row: GateBadgeRow;
  reason: string;
  onReasonChange: (value: string) => void;
  canConfirm: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("peerParticipants");
  const titleId = useId();
  const reasonId = useId();
  return (
    <ModalDialog labelledBy={titleId} onClose={onClose}>
      <h2 id={titleId} className="text-base font-semibold text-[#22262b]">
        {t("revokeTitle", { name: row.fullName })}
      </h2>
      <p className="text-sm text-[#676e78]">{t("revokeIntro")}</p>
      <label htmlFor={reasonId} className="block text-sm font-medium">
        {t("reason")}
      </label>
      <textarea
        id={reasonId}
        value={reason}
        maxLength={500}
        onChange={(event) => onReasonChange(event.target.value)}
        className="h-24 w-full rounded-xl border border-[#e4e7ea] p-3 text-sm"
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-[#e4e7ea] px-4 py-2 text-sm"
        >
          {t("cancel")}
        </button>
        <button
          type="button"
          disabled={!canConfirm}
          onClick={onConfirm}
          className="rounded-full bg-[#b94f12] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {t("confirmRevoke")}
        </button>
      </div>
    </ModalDialog>
  );
}
