"use client";

import { useTranslations } from "next-intl";

import { useProgramRoster } from "@/hooks/use-coordinator-program";

// TEST UI: placeholder until the design team's screen; replace when it arrives.
/** "İzinli liste": who may join a roster-only program. Saves on each add and remove. */
export function ProgramRosterSection({
  programId,
  archived,
}: {
  programId: string;
  archived: boolean;
}) {
  const t = useTranslations("programSettings");
  const roster = useProgramRoster(programId);

  return (
    <div className="space-y-3">
      <label className="block text-[12.5px] font-medium text-[#676e78]">
        {t("roster.paste")}
        <textarea
          value={roster.text}
          rows={4}
          disabled={archived}
          placeholder={t("roster.placeholder")}
          onChange={(event) => roster.setText(event.target.value)}
          className="mt-1.5 w-full rounded-2xl border border-[#e9ecef] px-4 py-3 text-[13.5px] text-[#22262b] outline-none focus:border-[#22262b] disabled:bg-[#f7f8f9]"
        />
      </label>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={roster.add}
          disabled={archived || !roster.canAdd}
          className="rounded-full bg-[#22262b] px-5 py-[9px] text-[13px] font-medium text-white disabled:bg-[#aeb4bc]"
        >
          {roster.busy ? t("roster.adding") : t("roster.add")}
        </button>
      </div>
      <p className="text-[12.5px] text-[#858c96]">
        {t("roster.count", { count: roster.entries.length })}
      </p>
      {roster.loading ? null : roster.entries.length === 0 ? (
        <p className="text-[13px] text-[#676e78]">{t("roster.empty")}</p>
      ) : (
        <ul className="divide-y divide-[#f0f2f4] rounded-2xl border border-[#e9ecef]">
          {roster.entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-3 px-4 py-2.5"
            >
              <span className="min-w-0 truncate text-[13.5px] text-[#22262b]">
                {entry.email}
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="text-[12px] text-[#858c96]">
                  {entry.registered
                    ? t("roster.registered")
                    : t("roster.notRegistered")}
                </span>
                <button
                  type="button"
                  onClick={() => roster.remove(entry.id)}
                  disabled={archived || roster.busy}
                  aria-label={t("roster.removeLabel", { email: entry.email })}
                  className="text-[12.5px] font-medium text-[#d9464b] disabled:text-[#aeb4bc]"
                >
                  {t("roster.remove")}
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
