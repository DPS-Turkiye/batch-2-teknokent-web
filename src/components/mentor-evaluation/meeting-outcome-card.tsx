// TEST UI: placeholder until the design team's screen; replace when it arrives.
import { useTranslations } from "next-intl";

import type { useMentorMeetingEvaluation } from "@/hooks/use-mentor-meeting-evaluation";
import { MENTOR_NO_SHOW_NOTE_MAX_LENGTH } from "@/lib/const/mentor-evaluation";

const buttonClass =
  "inline-flex items-center justify-center rounded-full px-[18px] py-2.5 text-[12.5px] font-medium leading-[19px]";
const primaryClass = `${buttonClass} bg-[#26a4ff] text-white hover:bg-[#1592ec] disabled:bg-[#f3f4f6] disabled:text-[#aeb4bc]`;
const secondaryClass = `${buttonClass} border border-[#d4d8dd] bg-white text-[#4a5059] hover:border-[#26a4ff] disabled:text-[#aeb4bc]`;

type Evaluation = ReturnType<typeof useMentorMeetingEvaluation>;

/** "Bu görüşme yapıldı mı?": held, or the startup did not come. */
export function MeetingOutcomeCard({ evaluation }: { evaluation: Evaluation }) {
  const t = useTranslations("mentorEvaluation");
  const error = evaluation.heldError ?? evaluation.noShowError;

  return (
    <section className="w-full rounded-[20px] border border-[#e4e7ea] bg-white px-8 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-5 text-[#22262b]">
            {evaluation.noShow
              ? t("noShowDone")
              : evaluation.held
                ? t("heldDone")
                : t("heldQuestion")}
          </p>
          <p className="mt-1 text-xs text-[#858c96]">
            {evaluation.noShow || evaluation.noShowOpen
              ? t("noShowHint")
              : t("heldHint")}
          </p>
        </div>
        <OutcomeButtons evaluation={evaluation} />
      </div>
      {evaluation.noShowOpen ? <NoShowForm evaluation={evaluation} /> : null}
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error.message}
        </p>
      ) : null}
    </section>
  );
}

function OutcomeButtons({ evaluation }: { evaluation: Evaluation }) {
  const t = useTranslations("mentorEvaluation");
  const saving = evaluation.isSavingHeld || evaluation.isSavingNoShow;

  if (evaluation.noShowOpen) return null;
  if (evaluation.noShow || evaluation.held) {
    return (
      <button
        type="button"
        onClick={
          evaluation.noShow ? evaluation.undoNoShow : evaluation.undoHeld
        }
        disabled={saving}
        className={secondaryClass}
      >
        {saving ? t("heldSaving") : t("heldUndo")}
      </button>
    );
  }
  return (
    <div className="flex flex-wrap gap-2.5">
      {evaluation.isSent ? null : (
        <button
          type="button"
          onClick={evaluation.openNoShow}
          disabled={saving}
          className={secondaryClass}
        >
          {t("noShow")}
        </button>
      )}
      <button
        type="button"
        onClick={evaluation.confirmHeld}
        disabled={saving}
        className={primaryClass}
      >
        {saving ? t("heldSaving") : t("heldConfirm")}
      </button>
    </div>
  );
}

function NoShowForm({ evaluation }: { evaluation: Evaluation }) {
  const t = useTranslations("mentorEvaluation");
  return (
    <div className="mt-4 flex flex-col gap-3">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium leading-5 text-[#22262b]">
          {t("noShowNote")}{" "}
          <span className="font-normal text-[#858c96]">{t("optional")}</span>
        </span>
        <textarea
          value={evaluation.noShowNote}
          onChange={(event) => evaluation.setNoShowNote(event.target.value)}
          maxLength={MENTOR_NO_SHOW_NOTE_MAX_LENGTH}
          placeholder={t("noShowNotePlaceholder")}
          className="h-[72px] w-full resize-none rounded-xl border border-[#e4e7ea] bg-white px-3.5 py-3 text-[13px] leading-[19px] text-[#22262b] outline-none placeholder:text-[#aeb4bc] focus:border-[#26a4ff]"
        />
      </label>
      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={evaluation.confirmNoShow}
          disabled={evaluation.isSavingNoShow}
          className={primaryClass}
        >
          {evaluation.isSavingNoShow ? t("heldSaving") : t("noShowConfirm")}
        </button>
        <button
          type="button"
          onClick={evaluation.closeNoShow}
          disabled={evaluation.isSavingNoShow}
          className={secondaryClass}
        >
          {t("noShowCancel")}
        </button>
      </div>
    </div>
  );
}
