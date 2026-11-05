"use client";

import { useTranslations } from "next-intl";

import { useMenteeProgramSelector } from "@/hooks/use-mentee-program-selector";

export function MenteeProgramSelector() {
  const t = useTranslations("mentorsDirectory.program");
  const selector = useMenteeProgramSelector();
  if (!selector.visible) return null;

  return (
    <div className="mb-4 flex flex-col gap-1.5 rounded-2xl border border-[#e4e7ea] bg-white p-4 sm:flex-row sm:items-center sm:gap-3">
      <label
        htmlFor="mentee-program"
        className="text-sm font-medium text-[#22262b]"
      >
        {t("label")}
      </label>
      <select
        id="mentee-program"
        value={selector.currentId}
        disabled={selector.switching}
        onChange={(event) => selector.select(event.target.value)}
        aria-describedby="mentee-program-hint"
        className="min-h-10 rounded-xl border border-[#e4e7ea] bg-[#f8f9fa] px-3 text-sm text-[#22262b] disabled:opacity-60"
      >
        {selector.programs.map((program) => (
          <option key={program.id} value={program.id}>
            {program.name}
          </option>
        ))}
      </select>
      <p id="mentee-program-hint" className="text-xs text-[#676e78]">
        {t("hint")}
      </p>
    </div>
  );
}
