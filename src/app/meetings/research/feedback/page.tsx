"use client";

import { Suspense } from "react";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Avatar } from "@/components/common/avatar";
import { AppShell } from "@/components/hoc/app-shell";
import { useMeetingFeedback } from "@/hooks/use-meeting-lifecycle";
import { MEETING_FEEDBACK_QUESTIONS } from "@/lib/const";
import { AppArea } from "@/types/app-area";

const benefits = [
  "Finansal modeli anlamak",
  "Önceliklerimi netleştirmek",
  "Somut aksiyonlar belirlemek",
  "Yeni bir bakış açısı kazanmak",
];

function MeetingFeedbackContent() {
  const {
    canSubmit,
    rate,
    ratings,
    selectedBenefits,
    submit,
    submitError,
    submitted,
    submitting,
    toggleBenefit,
  } = useMeetingFeedback();

  return (
    <AppShell
      active={AppArea.Meetings}
      title="Görüşmeyi Değerlendir"
      backHref="/meetings/research/summary"
    >
      <div className="mx-auto w-full max-w-[880px] px-4 pb-14 pt-8 sm:px-8">
        {submitted ? (
          <section className="rounded-3xl border border-[#e4e7ea] bg-white px-6 py-20 text-center shadow-sm">
            <CheckCircle2 className="mx-auto size-14 text-[#23824b]" />
            <h1 className="mt-5 text-2xl font-semibold">
              Değerlendirmen gönderildi
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#676e78]">
              Geri bildirimin mentorluk deneyimini geliştirmek için
              kullanılacak.
            </p>
            <Link
              href="/mentorships"
              className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[#e86f22] px-5 text-sm font-semibold text-white"
            >
              Mentorluklarıma dön
            </Link>
          </section>
        ) : (
          <>
            <section className="flex items-center gap-4">
              <Avatar initials="ÇY" size="lg" tone="orange" />
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Bu görüşme sana ne kadar yardımcı oldu?
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#676e78]">
                  Çağrı ile yaptığın görüşmenin sana sağladığı netlik ve
                  ilerlemeyi değerlendirmek için birkaç kısa soru.
                </p>
                <p className="mt-2 text-xs text-[#858c96]">
                  Çağrı Yılmaz · Financial Planning & Business Model
                </p>
              </div>
            </section>
            <section className="mt-7 rounded-3xl border border-[#e4e7ea] bg-white p-6 shadow-sm sm:p-8">
              <p className="rounded-xl border border-[#f2b78f] bg-[#fff9f5] p-4 text-xs leading-5 text-[#9b4f1d]">
                Bu değerlendirme mentoru puanlamak için değil, mentorluk
                deneyiminin sana ne kadar yardımcı olduğunu anlamak için
                kullanılır.
              </p>
              <div className="mt-7 space-y-7">
                {MEETING_FEEDBACK_QUESTIONS.map((question, questionIndex) => (
                  <fieldset key={question}>
                    <legend className="text-sm font-medium">
                      {questionIndex + 1}. {question}
                    </legend>
                    <div className="mt-3 grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          aria-label={question + ": " + value}
                          aria-pressed={ratings[questionIndex] === value}
                          onClick={() => rate(questionIndex, value)}
                          className={
                            "min-h-11 rounded-xl border text-sm font-semibold " +
                            (ratings[questionIndex] === value
                              ? "border-[#e86f22] bg-[#e86f22] text-white"
                              : "border-[#e4e7ea] bg-white text-[#676e78] hover:border-[#f2b78f]")
                          }
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
              <h2 className="mt-8 text-sm font-semibold">
                Bu görüşmede sana en çok ne yardımcı oldu?
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {benefits.map((benefit) => (
                  <button
                    key={benefit}
                    type="button"
                    aria-pressed={selectedBenefits.has(benefit)}
                    onClick={() => toggleBenefit(benefit)}
                    className={
                      "rounded-full border px-4 py-2 text-xs font-medium " +
                      (selectedBenefits.has(benefit)
                        ? "border-[#e86f22] bg-[#fdebdd] text-[#c85816]"
                        : "border-[#e4e7ea] text-[#676e78]")
                    }
                  >
                    {benefit}
                  </button>
                ))}
              </div>
              <label className="mt-7 block text-sm font-medium">
                Bir sonraki görüşmede farklı olmasını istediğin bir şey var mı?
                <textarea
                  placeholder="İsteğe bağlı not…"
                  className="mt-2 min-h-28 w-full resize-y rounded-xl border border-[#dfe2e6] p-4 text-sm font-normal outline-none"
                />
              </label>
              {submitError ? (
                <p
                  role="alert"
                  className="mt-6 rounded-xl bg-[#fdeaea] px-4 py-3 text-sm text-[#b42318]"
                >
                  {submitError}
                </p>
              ) : null}

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={submit}
                  disabled={!canSubmit}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#e86f22] px-5 text-sm font-semibold text-white hover:bg-[#ce5e19] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Gönderiliyor..." : "Değerlendirmeyi gönder"}
                </button>
                <Link
                  href="/mentorships"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#e4e7ea] bg-white px-5 text-sm font-semibold text-[#515861]"
                >
                  Daha sonra
                </Link>
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function MeetingFeedbackPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-[#f7f7f8] text-sm text-[#676e78]">
          Değerlendirme yükleniyor…
        </div>
      }
    >
      <MeetingFeedbackContent />
    </Suspense>
  );
}
