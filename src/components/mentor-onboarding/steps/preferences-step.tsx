"use client";

import { ChipGroup } from "@/components/common/chip-group";
import { RequiredHint } from "@/components/common/required-hint";
import type { MentorOnboarding } from "@/hooks/use-mentor-onboarding";
import {
  CAPACITY_OPTIONS,
  MENTORING_STYLES,
  MENTOR_SECTORS,
  WORKING_STAGES,
} from "@/interfaces/mentor-onboarding";

export function PreferencesStep({ flow }: { flow: MentorOnboarding }) {
  const {
    draft,
    toggleMentoringStyle,
    toggleWorkingStage,
    toggleSector,
    setCapacity,
  } = flow;

  return (
    <div className="mx-auto w-full max-w-[620px] space-y-5">
      <header>
        <h1 className="text-[22px] font-semibold tracking-tight">
          Mentorluk tercihlerinizi belirleyin
        </h1>
      </header>

      <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5 sm:p-6">
        <h2 className="mb-3 text-sm font-semibold">Mentorluk biçimi *</h2>
        <ChipGroup
          label="Mentorluk biçimi"
          options={MENTORING_STYLES}
          selected={draft.mentoringStyles}
          onToggle={toggleMentoringStyle}
        />
        <RequiredHint show={draft.mentoringStyles.length === 0} />
      </section>

      <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5 sm:p-6">
        <h2 className="mb-3 text-sm font-semibold">
          Çalışmak istediğiniz girişim aşaması *
        </h2>
        <ChipGroup
          label="Çalışmak istediğiniz girişim aşaması"
          options={WORKING_STAGES}
          selected={draft.workingStages}
          onToggle={toggleWorkingStage}
        />
        <RequiredHint show={draft.workingStages.length === 0} />
      </section>

      <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-semibold">Tercih edilen sektörler *</h2>
        </div>
        <ChipGroup
          label="Tercih edilen sektörler"
          options={MENTOR_SECTORS}
          selected={draft.sectors}
          onToggle={toggleSector}
        />
        <RequiredHint show={draft.sectors.length === 0} />
      </section>

      <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5 sm:p-6">
        <h2 className="text-sm font-semibold">
          Aynı anda kaç girişimle çalışabilirsiniz?
        </h2>
        <div
          role="radiogroup"
          aria-label="Aynı anda çalışılabilecek girişim sayısı"
          className="mt-3 flex flex-wrap gap-2"
        >
          {CAPACITY_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={draft.capacity === option}
              onClick={() => setCapacity(option)}
              className={`min-h-10 min-w-12 rounded-lg border px-3 text-sm font-semibold transition ${
                draft.capacity === option
                  ? "border-[#e86f22] bg-[#fff9f5] text-[#c85816]"
                  : "border-[#e4e7ea] bg-white text-[#676e78] hover:border-[#f2b78f]"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-[#858c96]">
          Bu değeri daha sonra profilinizden değiştirebilirsiniz.
        </p>
      </section>
    </div>
  );
}
