"use client";

import { ChipGroup } from "@/components/common/chip-group";
import type { MentorOnboarding } from "@/hooks/use-mentor-onboarding";
import {
  ADDITIONAL_EXPERTISE,
  MAX_EXPERTISE_AREAS,
  SUGGESTED_EXPERTISE,
} from "@/interfaces/mentor-onboarding";

export function ExpertiseStep({ flow }: { flow: MentorOnboarding }) {
  const { draft, toggleExpertise, expertiseLimitReached } = flow;

  return (
    <div className="mx-auto w-full max-w-[620px] space-y-5">
      <header>
        <h1 className="text-[22px] font-semibold tracking-tight">
          Hangi konularda mentorluk vermek istersiniz?
        </h1>
      </header>

      <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5 sm:p-6">
        <h2 className="text-sm font-semibold">Deneyiminize göre önerilenler</h2>
        <p className="mb-3 mt-1.5 text-xs text-[#676e78]">
          CV&apos;nizden gelen alanları sizin için öne çıkardık.
        </p>
        <ChipGroup
          label="Önerilen uzmanlık alanları"
          options={SUGGESTED_EXPERTISE}
          selected={draft.expertise}
          onToggle={toggleExpertise}
        />
      </section>

      <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5 sm:p-6">
        <h2 className="text-sm font-semibold">
          Bunları da eklemek isteyebilirsiniz
        </h2>
        <div className="mt-3">
          <ChipGroup
            label="Ek uzmanlık alanları"
            options={ADDITIONAL_EXPERTISE}
            selected={draft.expertise}
            onToggle={toggleExpertise}
          />
        </div>
        <p
          className={`mt-3 text-[11px] ${
            expertiseLimitReached
              ? "font-medium text-[#c85816]"
              : "text-[#858c96]"
          }`}
        >
          En fazla {MAX_EXPERTISE_AREAS} alan seçebilirsiniz.
          {expertiseLimitReached ? " Sınıra ulaştınız." : ""}
        </p>
      </section>

      <p className="rounded-2xl bg-[#f1f2f4] p-4 text-xs leading-relaxed text-[#676e78]">
        <strong className="font-semibold text-[#3c424a]">
          Deneyim ≠ mentorluk tercihi.
        </strong>{" "}
        Bir konuda deneyimli olmanız, o konuda mentorluk vermek istediğiniz
        anlamına gelmez — yalnızca vermek istediklerinizi seçin.
      </p>
    </div>
  );
}
