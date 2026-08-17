"use client";

import { useState } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { Badge } from "@/components/common/badge";
import { Avatar } from "@/components/common/avatar";
import { MEETING_FEEDBACK_QUESTIONS } from "@/lib/const";
import { AppArea } from "@/types/app-area";

export default function MeetingFeedbackPage() {
  const [ratings, setRatings] = useState<Record<string, number>>({});

  return (
    <AppShell
      active={AppArea.Meetings}
      title="Toplantıyı Değerlendir"
      backHref="/meetings/research"
    >
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8">
        <section className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white p-4">
          <Avatar initials="DK" size="sm" />
          <div className="flex-1">
            <h2 className="text-sm font-semibold">Dr. Kemal Arslan</h2>
            <p className="mt-1 text-xs text-[#777]">
              Kullanıcı testi · 12 Ağustos 2024
            </p>
          </div>
          <Badge>Tamamlandı</Badge>
        </section>

        <section className="mt-4 rounded-lg border border-[#e5e7eb] bg-white p-5">
          <h1 className="text-lg font-semibold">Görüşme nasıldı?</h1>
          <p className="mt-1 text-sm text-[#777]">
            Geri bildiriminiz mentorluk deneyimini geliştirmemize yardımcı olur.
          </p>
          <div className="mt-6 space-y-6">
            {MEETING_FEEDBACK_QUESTIONS.map((question) => (
              <fieldset key={question}>
                <legend className="text-sm font-medium">{question}</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      aria-label={`${question}: ${rating}`}
                      aria-pressed={ratings[question] === rating}
                      onClick={() =>
                        setRatings((current) => ({
                          ...current,
                          [question]: rating,
                        }))
                      }
                      className={`flex size-10 items-center justify-center rounded-md border text-sm ${ratings[question] === rating ? "border-[#555] bg-[#555] text-white" : "border-[#e5e7eb] bg-white text-[#555]"}`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          <label className="mt-6 block text-sm font-medium">
            Bu mentorla devam etmek ister misiniz?
            <select className="mt-2 w-full rounded-md border border-[#e5e7eb] p-3 text-sm">
              <option>Henüz karar vermedim</option>
              <option>Evet, devam etmek isterim</option>
              <option>Hayır, başka bir mentor arıyorum</option>
            </select>
          </label>
          <label className="mt-5 block text-sm font-medium">
            Eklemek istediğiniz bir not var mı?
            <textarea
              placeholder="Deneyiminizi kısaca paylaşın..."
              className="mt-2 min-h-28 w-full resize-none rounded-md border border-[#e5e7eb] p-3 text-sm"
            />
          </label>
          <div className="mt-6 flex justify-end gap-2">
            <SecondaryButton href="/meetings/research">
              Daha Sonra
            </SecondaryButton>
            <PrimaryButton href="/mentorships/research">
              Değerlendirmeyi Gönder
            </PrimaryButton>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
