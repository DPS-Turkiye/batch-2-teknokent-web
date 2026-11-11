"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.
import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

import { useCoordinatorPicker } from "@/hooks/use-coordinator-picker";
import {
  COORDINATOR_SEARCH_MIN_LENGTH,
  type CoordinatorChoice,
} from "@/lib/coordinator-picker";

const FIELD =
  "h-11 w-full rounded-2xl border border-[#e9ecef] px-4 text-[13.5px] text-[#22262b] outline-none focus:border-[#22262b]";

/** Pick coordinators by email; nobody's name or email shows until the admin searches for them. */
export function CoordinatorPicker({
  chosen,
  onChange,
  programId,
}: {
  chosen: readonly CoordinatorChoice[];
  onChange: (next: CoordinatorChoice[]) => void;
  programId?: string | undefined;
}) {
  const t = useTranslations("coordinatorPicker");
  const picker = useCoordinatorPicker({ chosen, onChange, programId });
  // The clicked row or chip disappears, so focus goes back to the field instead of the top of the page.
  const field = useRef<HTMLInputElement>(null);
  const andRefocus = (action: () => void) => () => {
    action();
    field.current?.focus();
  };

  return (
    <div className="space-y-4">
      {picker.chosen.length > 0 ? (
        <ul aria-label={t("chosen")} className="flex flex-wrap gap-2">
          {picker.chosen.map((choice) => (
            <li
              key={choice.key}
              className="flex items-center gap-2 rounded-full border border-[#e9ecef] bg-[#f8f9fa] py-1.5 pr-1.5 pl-3.5 text-[13px] text-[#22262b]"
            >
              <span className="min-w-0">
                <span className="font-medium">{choice.fullName}</span>{" "}
                <span className="text-[#858c96]">{choice.email}</span>
              </span>
              {choice.invited ? (
                <span className="rounded-full bg-[#fff4e0] px-2 py-0.5 text-[11.5px] text-[#b7791f]">
                  {t("invitedTag")}
                </span>
              ) : null}
              <button
                type="button"
                onClick={andRefocus(() => picker.remove(choice.key))}
                aria-label={t("remove", { name: choice.fullName })}
                className="grid size-6 place-items-center rounded-full text-[#676e78] hover:bg-[#e9ecef]"
              >
                <X aria-hidden className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <label className="block text-[13px] text-[#676e78]">
        {t("label")}
        <input
          ref={field}
          type="text"
          inputMode="email"
          autoComplete="off"
          spellCheck={false}
          value={picker.query}
          onChange={(event) => picker.setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
          }}
          placeholder={t("placeholder")}
          className={`mt-1.5 ${FIELD}`}
        />
      </label>

      {picker.error && !picker.searching ? (
        <p role="alert" className="text-[13px] text-[#d9464b]">
          {picker.error}
        </p>
      ) : null}
      <div aria-live="polite" className="text-[13px]">
        {picker.tooShort ? (
          <p className="text-[#858c96]">
            {t("hint", { min: COORDINATOR_SEARCH_MIN_LENGTH })}
          </p>
        ) : picker.searching ? (
          <p className="text-[#858c96]">{t("searching")}</p>
        ) : picker.error ? null : picker.refusal ? (
          <p className="text-[#b7791f]">{picker.refusal}</p>
        ) : picker.noMatches ? (
          <p className="text-[#858c96]">{t("noMatches")}</p>
        ) : picker.results.length > 0 ? (
          <p className="sr-only">
            {t("resultCount", { count: picker.results.length })}
          </p>
        ) : null}
      </div>

      {picker.results.length > 0 && !picker.searching ? (
        <ul aria-label={t("results")} className="space-y-2">
          {picker.results.map((result) => (
            <li key={result.id}>
              <button
                type="button"
                onClick={andRefocus(() => picker.pick(result.id))}
                aria-label={t("addNamed", { name: result.fullName })}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[#e9ecef] px-4 py-3 text-left hover:border-[#22262b]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] text-[#22262b]">
                    {result.fullName}
                  </span>
                  <span className="block truncate text-[12px] text-[#858c96]">
                    {result.email}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-[#22262b]">
                  <Plus aria-hidden className="size-4" /> {t("add")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {picker.inviteEmail && !picker.searching ? (
        <div className="space-y-3 rounded-2xl border border-dashed border-[#d5d9de] p-4">
          <p className="text-[13.5px] text-[#22262b]">
            {t("inviteTitle", { email: picker.inviteEmail })}
          </p>
          <p className="text-[12.5px] leading-[1.5] text-[#676e78]">
            {t("inviteNote")}
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-[200px] flex-1 text-[13px] text-[#676e78]">
              {t("inviteName")}
              <input
                type="text"
                autoComplete="off"
                value={picker.inviteName}
                onChange={(event) => picker.setInviteName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  andRefocus(picker.invite)();
                }}
                className={`mt-1.5 ${FIELD}`}
              />
            </label>
            <button
              type="button"
              onClick={andRefocus(picker.invite)}
              disabled={!picker.canInvite}
              className="h-11 rounded-full bg-[#22262b] px-5 text-[13.5px] font-medium text-white disabled:bg-[#aeb4bc]"
            >
              {t("invite")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
