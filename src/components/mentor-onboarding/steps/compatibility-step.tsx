"use client";

import { Check } from "lucide-react";

import { ChipGroup } from "@/components/common/chip-group";
import { RequiredHint } from "@/components/common/required-hint";
import type { MentorOnboarding } from "@/hooks/use-mentor-onboarding";
import { PROGRAM_STAGES, SUPPORT_TOPICS } from "@/interfaces/mentor-onboarding";

export function CompatibilityStep({ flow }: { flow: MentorOnboarding }) {
  const { draft, toggleSupportTopic, toggleProgramStage } = flow;

  return (
    <div className="mx-auto w-full max-w-[620px] space-y-5">
      <header>
        <h1 className="text-[22px] font-semibold tracking-tight">
          Hangi konularda en çok katkı sağlayabilirsiniz?
        </h1>
      </header>

      <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5 sm:p-6">
        <h2 className="text-sm font-semibold">
          Destek verebileceğiniz problemler
        </h2>
        <p className="mb-3 mt-1.5 text-xs text-[#676e78]">
          Uzmanlık seçimlerinize göre en ilgili konuları öne çıkardık.
        </p>
        <ChipGroup
          label="Destek verebileceğiniz problemler"
          options={SUPPORT_TOPICS}
          selected={draft.supportTopics}
          onToggle={toggleSupportTopic}
        />
        <RequiredHint show={draft.supportTopics.length === 0} />
      </section>

      <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5 sm:p-6">
        <h2 className="text-sm font-semibold">
          Hangi aşamadaki girişimlerle çalışmak istersiniz?
        </h2>
        <p className="mb-3 mt-1.5 text-xs text-[#676e78]">
          Birden fazla aşama seçebilirsiniz.
        </p>
        <div
          role="group"
          aria-label="Girişim aşamaları"
          className="space-y-2.5"
        >
          {PROGRAM_STAGES.map((stage) => {
            const isSelected = draft.programStages.includes(stage.id);
            return (
              <button
                key={stage.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleProgramStage(stage.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
                  isSelected
                    ? "border-[#e86f22] bg-[#fff9f5]"
                    : "border-[#e4e7ea] bg-white hover:border-[#f2b78f]"
                }`}
              >
                <span
                  aria-hidden
                  className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${
                    isSelected
                      ? "border-[#e86f22] bg-[#e86f22] text-white"
                      : "border-[#d6dade] bg-white"
                  }`}
                >
                  {isSelected ? <Check className="size-3" /> : null}
                </span>
                <span>
                  <span className="block text-sm font-semibold">
                    {stage.label}
                  </span>
                  <span className="block text-xs text-[#676e78]">
                    {stage.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <RequiredHint show={draft.programStages.length === 0} />
      </section>

      <p className="rounded-2xl bg-[#f1f2f4] p-4 text-xs text-[#676e78]">
        Bu seçimler eşleşmeleri iyileştirir.
      </p>
    </div>
  );
}
