// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import { createPortal } from "react-dom";

import { AdminOverlay } from "@/components/admin/admin-ui";
import { useMoveMember, type MemberMove } from "@/hooks/use-move-member";

const MOVED_ITEMS = ["profile", "files", "history"] as const;
const KEPT_ITEMS = ["mentorships", "tasks", "documents"] as const;

const LIST_HEADING = "mt-4 text-[13px] font-medium text-[#22262b]";
const LIST =
  "mt-1.5 list-disc space-y-1 pl-5 text-[13px] leading-[1.5] text-[#676e78]";
const SECONDARY_BUTTON =
  "rounded-full border border-[#e9ecef] px-5 py-[11px] text-[13.5px] font-medium text-[#22262b]";

/** "Başka takıma taşı": the trigger plus its dialog, for one person on an admin or coordinator screen. */
export function MoveMemberButton({
  userId,
  programId,
  className,
}: {
  userId: string;
  programId?: string;
  className: string;
}) {
  const t = useTranslations("teamMove");
  const move = useMoveMember(userId, programId);
  return (
    <>
      <button type="button" onClick={move.show} className={className}>
        {t("action")}
      </button>
      {move.open ? <MoveMemberDialog move={move} /> : null}
    </>
  );
}

function MoveMemberDialog({ move }: { move: MemberMove }) {
  const t = useTranslations("teamMove");
  const searchId = useId();

  // Portalled: drawers keep a transform from their slide-in, which would trap a fixed overlay inside them.
  return createPortal(
    <AdminOverlay
      label={t("dialogTitle")}
      onClose={move.close}
      className="z-[60]"
    >
      <form
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[28px] bg-white p-6 shadow-[0_16px_48px_rgba(33,38,43,0.14)]"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          move.confirm();
        }}
      >
        <h2 className="text-[18px] font-semibold text-[#22262b]">
          {t("dialogTitle")}
        </h2>
        {move.loading ? (
          <p role="status" className="mt-3 text-[13px] text-[#858c96]">
            {t("loading")}
          </p>
        ) : null}
        {move.loadError ? (
          <p role="alert" className="mt-3 text-[13px] text-[#c2410c]">
            {move.loadError}
          </p>
        ) : null}
        {move.fullName ? (
          <p className="mt-2 text-[13.5px] text-[#22262b]">{move.fullName}</p>
        ) : null}
        {move.currentTeamLabel ? (
          <p className="mt-1 text-[13px] text-[#676e78]">
            {t("currentTeam", { team: move.currentTeamLabel })}
          </p>
        ) : null}

        {move.blockedKey ? (
          <p
            role="status"
            className="mt-4 rounded-2xl bg-[#fff6ed] px-4 py-3 text-[13px] leading-[1.5] text-[#9a3412]"
          >
            {t(`blocked.${move.blockedKey}`)}
          </p>
        ) : null}

        {!move.loading && !move.blockedKey && move.fullName ? (
          move.hasTargets ? (
            <TargetPicker move={move} searchId={searchId} />
          ) : (
            <p className="mt-4 text-[13px] text-[#858c96]">{t("noTargets")}</p>
          )
        ) : null}

        {move.target ? (
          <>
            <p className="mt-4 text-[13px] leading-[1.5] text-[#22262b]">
              {t("summary", {
                name: move.fullName,
                team: move.target.name,
              })}
            </p>
            <p className={LIST_HEADING}>{t("movedHeading")}</p>
            <ul className={LIST}>
              {MOVED_ITEMS.map((item) => (
                <li key={item}>{t(`movedItems.${item}`)}</li>
              ))}
            </ul>
            <p className={LIST_HEADING}>{t("keptHeading")}</p>
            <ul className={LIST}>
              {KEPT_ITEMS.map((item) => (
                <li key={item}>{t(`keptItems.${item}`)}</li>
              ))}
            </ul>
            <p className="mt-4 text-[13px] leading-[1.5] text-[#676e78]">
              {t("notice")}
            </p>
            <p className="mt-2 text-[13px] leading-[1.5] text-[#676e78]">
              {t("sessionNotice")}
            </p>
          </>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          {/* Focus starts on the way out: the move happens at once and notifies people. */}
          <button
            type="button"
            autoFocus
            onClick={move.close}
            disabled={move.pending}
            className={SECONDARY_BUTTON}
          >
            {move.blockedKey ? t("close") : t("cancel")}
          </button>
          {move.blockedKey ? null : (
            <button
              type="submit"
              disabled={!move.canMove}
              className="rounded-full bg-[#22262b] px-5 py-[11px] text-[13.5px] font-medium text-white disabled:bg-[#aeb4bc]"
            >
              {move.pending ? t("moving") : t("confirm")}
            </button>
          )}
        </div>
      </form>
    </AdminOverlay>,
    document.body,
  );
}

function TargetPicker({
  move,
  searchId,
}: {
  move: MemberMove;
  searchId: string;
}) {
  const t = useTranslations("teamMove");
  return (
    <div className="mt-4">
      <label
        htmlFor={searchId}
        className="text-[13px] font-medium text-[#22262b]"
      >
        {t("searchLabel")}
      </label>
      <input
        id={searchId}
        type="search"
        value={move.search}
        onChange={(event) => move.setSearch(event.target.value)}
        placeholder={t("searchPlaceholder")}
        className="mt-1.5 w-full rounded-full border border-[#e9ecef] px-4 py-[9px] text-[13px] text-[#22262b]"
      />
      {move.targets.length === 0 ? (
        <p role="status" className="mt-2 text-[13px] text-[#858c96]">
          {t("noMatch")}
        </p>
      ) : (
        <fieldset className="mt-2 max-h-56 overflow-y-auto rounded-2xl border border-[#e9ecef]">
          <legend className="sr-only">{t("target")}</legend>
          {move.targets.map((team) => (
            <label
              key={team.organizationId}
              className="flex cursor-pointer items-start gap-3 border-b border-[#f0f2f4] px-4 py-2.5 last:border-b-0"
            >
              <input
                type="radio"
                name="target-team"
                value={team.organizationId}
                checked={move.targetId === team.organizationId}
                onChange={() => move.select(team.organizationId)}
                className="mt-1"
              />
              <span className="min-w-0">
                <span className="block text-[13.5px] text-[#22262b]">
                  {team.name}
                </span>
                {team.programName ? (
                  <span className="block text-[12px] text-[#858c96]">
                    {team.programName}
                  </span>
                ) : null}
              </span>
            </label>
          ))}
        </fieldset>
      )}
    </div>
  );
}
