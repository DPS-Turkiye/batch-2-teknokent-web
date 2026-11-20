// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";
import { createPortal } from "react-dom";

import { AdminOverlay } from "@/components/admin/admin-ui";
import {
  useChangeFounder,
  type FounderChange,
} from "@/hooks/use-change-founder";

const SECONDARY_BUTTON =
  "rounded-full border border-[#e9ecef] px-5 py-[11px] text-[13.5px] font-medium text-[#22262b]";

/** "Kurucuyu değiştir": the trigger plus its dialog, for one startup on an admin or coordinator screen. */
export function ChangeFounderButton({
  organizationId,
  programId,
  className,
}: {
  organizationId: string;
  programId?: string;
  className: string;
}) {
  const t = useTranslations("founderChange");
  const change = useChangeFounder(organizationId, programId);
  return (
    <>
      <button type="button" onClick={change.show} className={className}>
        {t("action")}
      </button>
      {change.open ? <ChangeFounderDialog change={change} /> : null}
    </>
  );
}

function ChangeFounderDialog({ change }: { change: FounderChange }) {
  const t = useTranslations("founderChange");

  // Portalled: drawers keep a transform from their slide-in, which would trap a fixed overlay inside them.
  return createPortal(
    <AdminOverlay
      label={t("dialogTitle")}
      onClose={change.close}
      className="z-[60]"
    >
      <form
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[28px] bg-white p-6 shadow-[0_16px_48px_rgba(33,38,43,0.14)]"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          change.confirm();
        }}
      >
        <h2 className="text-[18px] font-semibold text-[#22262b]">
          {t("dialogTitle")}
        </h2>
        {change.loading ? (
          <p role="status" className="mt-3 text-[13px] text-[#858c96]">
            {t("loading")}
          </p>
        ) : null}
        {change.loadError ? (
          <p role="alert" className="mt-3 text-[13px] text-[#c2410c]">
            {change.loadError}
          </p>
        ) : null}
        {change.loaded ? (
          <p className="mt-2 text-[13.5px] text-[#22262b]">
            {change.founderName
              ? t("current", {
                  team: change.teamName,
                  founder: change.founderName,
                })
              : t("noFounder", { team: change.teamName })}
          </p>
        ) : null}

        {change.loaded ? (
          change.candidates.length === 0 ? (
            <p className="mt-4 text-[13px] text-[#858c96]">
              {t("noCandidates")}
            </p>
          ) : (
            <fieldset className="mt-4 max-h-56 overflow-y-auto rounded-2xl border border-[#e9ecef]">
              <legend className="px-4 pt-3 text-[13px] font-medium text-[#22262b]">
                {t("candidates")}
              </legend>
              {change.candidates.map((person) => (
                <label
                  key={person.id}
                  className="flex cursor-pointer items-start gap-3 border-b border-[#f0f2f4] px-4 py-2.5 last:border-b-0"
                >
                  <input
                    type="radio"
                    name="new-founder"
                    value={person.id}
                    checked={change.candidateId === person.id}
                    onChange={() => change.select(person.id)}
                    className="mt-1"
                  />
                  <span className="min-w-0">
                    <span className="block text-[13.5px] text-[#22262b]">
                      {person.fullName}
                    </span>
                    {person.jobTitle ? (
                      <span className="block text-[12px] text-[#858c96]">
                        {person.jobTitle}
                      </span>
                    ) : null}
                  </span>
                </label>
              ))}
            </fieldset>
          )
        ) : null}

        {change.candidate ? (
          <>
            <p className="mt-4 text-[13px] leading-[1.5] text-[#22262b]">
              {t("summary", {
                name: change.candidate.fullName,
                team: change.teamName,
              })}
            </p>
            {change.founderName ? (
              <p className="mt-1 text-[13px] leading-[1.5] text-[#676e78]">
                {t("previousStays", { founder: change.founderName })}
              </p>
            ) : null}
            <p className="mt-3 text-[13px] leading-[1.5] text-[#676e78]">
              {t("notice")}
            </p>
          </>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          {/* Focus starts on the way out: the change happens at once and notifies people. */}
          <button
            type="button"
            autoFocus
            onClick={change.close}
            disabled={change.pending}
            className={SECONDARY_BUTTON}
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={!change.canChange}
            className="rounded-full bg-[#22262b] px-5 py-[11px] text-[13.5px] font-medium text-white disabled:bg-[#aeb4bc]"
          >
            {change.pending ? t("changing") : t("confirm")}
          </button>
        </div>
      </form>
    </AdminOverlay>,
    document.body,
  );
}
