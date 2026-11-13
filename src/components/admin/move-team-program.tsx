// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";
import { createPortal } from "react-dom";

import { AdminOverlay } from "@/components/admin/admin-ui";
import {
  useMoveTeamProgram,
  type MovableTeam,
  type TeamProgramMove,
} from "@/hooks/use-move-team-program";
import type { AdminProgram } from "@/interfaces/admin-overview";

const MOVED_ITEMS = ["team", "approval", "pendingChanges"] as const;
const KEPT_ITEMS = ["activity", "records"] as const;
const CLOSED_ITEMS = ["openRequests"] as const;

const LIST_HEADING = "mt-4 text-[13px] font-medium text-[#22262b]";
const LIST =
  "mt-1.5 list-disc space-y-1 pl-5 text-[13px] leading-[1.5] text-[#676e78]";

/** "Programı değiştir" in the admin's team drawer: pick another open program, then confirm what the move does. */
export function MoveTeamProgram({
  team,
  programs,
  onMoved,
}: {
  team: MovableTeam;
  programs: AdminProgram[];
  onMoved: () => void;
}) {
  const t = useTranslations("adminUsers.moveProgram");
  const move = useMoveTeamProgram(team, programs, onMoved);
  if (programs.length === 0) {
    return <p className="text-[12.5px] text-[#858c96]">{t("noTarget")}</p>;
  }

  return (
    <>
      <form
        aria-label={t("action")}
        className="flex flex-wrap items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          move.ask();
        }}
      >
        <select
          aria-label={t("target")}
          value={move.targetId}
          onChange={(event) => move.select(event.target.value)}
          className="min-w-0 flex-1 rounded-full border border-[#e9ecef] bg-white px-4 py-[9px] text-[13px] text-[#22262b]"
        >
          <option value="">{t("chooseTarget")}</option>
          {programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!move.canAsk}
          className="rounded-full bg-[#22262b] px-4 py-[9px] text-[13px] font-medium text-white disabled:bg-[#aeb4bc]"
        >
          {t("action")}
        </button>
      </form>
      {move.confirmation ? (
        <MoveTeamProgramDialog
          team={team}
          target={move.confirmation}
          move={move}
        />
      ) : null}
    </>
  );
}

function MoveTeamProgramDialog({
  team,
  target,
  move,
}: {
  team: MovableTeam;
  target: AdminProgram;
  move: TeamProgramMove;
}) {
  const t = useTranslations("adminUsers.moveProgram");

  // Portalled: the users drawer keeps a transform from its slide-in, which would trap a fixed overlay inside it.
  return createPortal(
    <AdminOverlay label={t("dialogTitle")} onClose={move.cancel}>
      <form
        className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_16px_48px_rgba(33,38,43,0.14)]"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          move.confirm();
        }}
      >
        <h2 className="text-[18px] font-semibold text-[#22262b]">
          {t("dialogTitle")}
        </h2>
        <p className="mt-2 text-[13.5px] leading-[1.5] text-[#676e78]">
          {t("dialogBody", {
            team: team.name,
            from: team.programName,
            to: target.name,
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
        <p className={LIST_HEADING}>{t("closedHeading")}</p>
        <ul className={LIST}>
          {CLOSED_ITEMS.map((item) => (
            <li key={item}>{t(`closedItems.${item}`)}</li>
          ))}
        </ul>
        <p className="mt-4 text-[13px] leading-[1.5] text-[#676e78]">
          {t("notice")}
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={move.cancel}
            disabled={move.pending}
            className="rounded-full border border-[#e9ecef] px-5 py-[11px] text-[13.5px] font-medium text-[#22262b]"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={move.pending}
            className="rounded-full bg-[#22262b] px-5 py-[11px] text-[13.5px] font-medium text-white disabled:bg-[#aeb4bc]"
          >
            {move.pending ? t("moving") : t("confirm")}
          </button>
        </div>
      </form>
    </AdminOverlay>,
    document.body,
  );
}
