// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";
import { createPortal } from "react-dom";

import { AdminOverlay } from "@/components/admin/admin-ui";
import {
  useRemoveMentorFromProgram,
  type MentorProgram,
  type MentorProgramRemoval,
  type RemovableMentor,
} from "@/hooks/use-remove-mentor-from-program";

const STOPPED_ITEMS = ["pool", "programPages"] as const;
const KEPT_ITEMS = ["activity", "records"] as const;
const WITHDRAWN_ITEMS = ["openRequests"] as const;

const LIST_HEADING = "mt-4 text-[13px] font-medium text-[#22262b]";
const LIST =
  "mt-1.5 list-disc space-y-1 pl-5 text-[13px] leading-[1.5] text-[#676e78]";

/** "Programdan çıkar" on a program row of the admin's mentor drawer: confirm what the removal does, then do it. */
export function RemoveMentorFromProgram({
  mentor,
  program,
}: {
  mentor: RemovableMentor;
  program: MentorProgram;
}) {
  const t = useTranslations("adminUsers.removeFromProgram");
  const removal = useRemoveMentorFromProgram(mentor, program);

  return (
    <>
      <button
        type="button"
        // Every program row has this button, so its name says which program it acts on.
        aria-label={t("actionFor", { program: program.name })}
        onClick={removal.ask}
        disabled={removal.pending}
        className="shrink-0 rounded-full border border-[#e9ecef] px-3.5 py-[7px] text-[12.5px] font-medium text-[#c2331f] hover:bg-[#fff1ec] disabled:text-[#aeb4bc]"
      >
        {t("action")}
      </button>
      {removal.confirming ? (
        <RemoveMentorFromProgramDialog
          mentor={mentor}
          program={program}
          removal={removal}
        />
      ) : null}
    </>
  );
}

function RemoveMentorFromProgramDialog({
  mentor,
  program,
  removal,
}: {
  mentor: RemovableMentor;
  program: MentorProgram;
  removal: MentorProgramRemoval;
}) {
  const t = useTranslations("adminUsers.removeFromProgram");

  // Portalled: the users drawer keeps a transform from its slide-in, which would trap a fixed overlay inside it.
  return createPortal(
    <AdminOverlay label={t("dialogTitle")} onClose={removal.cancel}>
      <form
        className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_16px_48px_rgba(33,38,43,0.14)]"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          removal.confirm();
        }}
      >
        <h2 className="text-[18px] font-semibold text-[#22262b]">
          {t("dialogTitle")}
        </h2>
        <p className="mt-2 text-[13.5px] leading-[1.5] text-[#676e78]">
          {t("dialogBody", { mentor: mentor.fullName, program: program.name })}
        </p>

        <p className={LIST_HEADING}>{t("stoppedHeading")}</p>
        <ul className={LIST}>
          {STOPPED_ITEMS.map((item) => (
            <li key={item}>{t(`stoppedItems.${item}`)}</li>
          ))}
        </ul>
        <p className={LIST_HEADING}>{t("keptHeading")}</p>
        <ul className={LIST}>
          {KEPT_ITEMS.map((item) => (
            <li key={item}>{t(`keptItems.${item}`)}</li>
          ))}
        </ul>
        <p className={LIST_HEADING}>{t("withdrawnHeading")}</p>
        <ul className={LIST}>
          {WITHDRAWN_ITEMS.map((item) => (
            <li key={item}>{t(`withdrawnItems.${item}`)}</li>
          ))}
        </ul>
        <p className="mt-4 text-[13px] leading-[1.5] text-[#676e78]">
          {t("notice")}
        </p>

        <div className="mt-5 flex justify-end gap-2">
          {/* Focus starts on the way out: the removal withdraws requests and notifies people. */}
          <button
            type="button"
            autoFocus
            onClick={removal.cancel}
            disabled={removal.pending}
            className="rounded-full border border-[#e9ecef] px-5 py-[11px] text-[13.5px] font-medium text-[#22262b]"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={removal.pending}
            className="rounded-full bg-[#22262b] px-5 py-[11px] text-[13.5px] font-medium text-white disabled:bg-[#aeb4bc]"
          >
            {removal.pending ? t("removing") : t("confirm")}
          </button>
        </div>
      </form>
    </AdminOverlay>,
    document.body,
  );
}
