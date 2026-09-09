"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { useAppSession } from "@/components/providers/session-provider";
import type {
  MentorAvailabilitySlot,
  MentorProfile,
} from "@/interfaces/mentor";
import type { StartupContext } from "@/interfaces/startup";
import {
  assignPreferredTime,
  availabilityColumns,
  hasThreeHalfHourTimes,
  isHalfOrFullHour,
  PREFERRED_SLOT_COUNT,
  slotTimeLabel,
  timeFromStartsAt,
} from "@/lib/mentor-availability-days";
import { profileMentorshipSubmission } from "@/lib/mentor-profile-request";
import {
  DEFAULT_NEED_GOAL_IDS,
  DEFAULT_NEED_SITUATION_ID,
  messageForNeedGoals,
  needTitleForSummary,
  readNeedDraft,
  summaryForNeed,
} from "@/lib/mentor-request-need";
import { submitMentorshipRequest } from "@/lib/mentorship-requests";

export function MentorRequestDialog({
  mentor,
  slots,
  startup,
  onClose,
  onSent,
}: {
  mentor: MentorProfile;
  slots: MentorAvailabilitySlot[];
  startup: StartupContext;
  onClose: () => void;
  onSent: (requestId: string) => void;
}) {
  const session = useAppSession();
  const draft = readNeedDraft();
  const [problem, setProblem] = useState(() =>
    draft
      ? summaryForNeed({
          topicId: draft.topicId,
          otherSummary: draft.otherSummary,
          situationId: draft.situationId ?? DEFAULT_NEED_SITUATION_ID,
          noneSummary: draft.noneSummary ?? "",
        })
      : "",
  );
  const [outcome, setOutcome] = useState(() =>
    draft
      ? messageForNeedGoals(
          draft.goalIds ?? DEFAULT_NEED_GOAL_IDS,
          draft.goalNote ?? "",
        )
      : "",
  );
  const [preferredTimes, setPreferredTimes] = useState<string[]>(
    Array.from({ length: PREFERRED_SLOT_COUNT }, () => ""),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const columns = availabilityColumns(slots);
  const topic =
    (draft
      ? needTitleForSummary(draft.topicId, draft.otherSummary)
      : mentor.specialties[0]) || mentor.professionalTitle;
  const canSend = hasThreeHalfHourTimes(preferredTimes);
  const durationMinutes =
    slots.find((slot) => !slot.booked)?.durationMinutes ?? 45;
  const summaryWhen = preferredTimes.filter(Boolean).join(" · ");

  function updateTime(index: number, value: string) {
    setPreferredTimes((current) =>
      current.map((time, timeIndex) => (timeIndex === index ? value : time)),
    );
  }

  async function sendRequest() {
    if (!session?.fullName) return;
    if (!canSend) {
      setError("Tam veya buçuk saatte üç farklı tercih seç.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const saved = await submitMentorshipRequest(
        profileMentorshipSubmission({
          mentor,
          startup,
          requestedForName: session.fullName,
          problem,
          outcome,
          preferredTimes: preferredTimes.filter(isHalfOrFullHour),
        }),
      );
      onSent(saved.id);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Talep gönderilemedi. Lütfen tekrar dene.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#32373e]/70 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-labelledby="mentor-request-title"
        className="max-h-[90vh] w-full max-w-[1002px] overflow-y-auto rounded-3xl bg-white p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id="mentor-request-title"
            className="text-[28px] font-semibold leading-tight text-[#22262b]"
          >
            {mentor.fullName} ile mentorluk planla
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="grid size-6 place-items-center text-[#676e78] hover:text-[#22262b]"
          >
            <X className="size-6" />
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <span className="grid size-[52px] place-items-center rounded-full bg-[#fdebdd] text-base font-medium text-[#e86f22]">
            {mentor.initials}
          </span>
          <div>
            <p className="text-base font-medium text-[#22262b]">
              {mentor.fullName}
            </p>
            <p className="text-xs text-[#676e78]">{mentor.professionalTitle}</p>
          </div>
        </div>

        <label className="mt-3 block rounded-[10px] border border-[#e4e7ea] bg-white p-4">
          <span className="text-base font-medium text-[#22262b]">
            Nerede takıldık?
          </span>
          <textarea
            value={problem}
            onChange={(event) => setProblem(event.target.value)}
            placeholder="Teknik ve ürün geliştirme tarafında ilerleyebiliyoruz ancak girişimin finansal yapısını nasıl modellememiz gerektiği konusunda deneyimimiz yok."
            className="mt-2.5 min-h-[54px] w-full rounded-lg border border-[#d4d8dd] px-3.5 py-3 text-xs text-[#22262b] outline-none placeholder:text-[#858c96]"
          />
        </label>

        <label className="mt-3 block rounded-[10px] border border-[#e4e7ea] bg-white p-4">
          <span className="text-base font-medium text-[#22262b]">
            Bu görüşmeden neyle ayrılmak istiyorsun?
          </span>
          <textarea
            value={outcome}
            onChange={(event) => setOutcome(event.target.value)}
            placeholder="İlk finansal modelimizin çerçevesini oluşturmak ve öncelikli varsayımlarımızı netleştirmek istiyoruz."
            className="mt-2.5 min-h-[54px] w-full rounded-lg border border-[#d4d8dd] px-3.5 py-3 text-xs text-[#22262b] outline-none placeholder:text-[#858c96]"
          />
        </label>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(280px,1fr)_minmax(0,1.3fr)]">
          <section className="rounded-[10px] border border-[#e4e7ea] bg-white p-4">
            <h3 className="text-base font-medium text-[#22262b]">Uygunluk</h3>
            <p className="mt-1 text-xs text-[#858c96]">Önümüzdeki 7 gün</p>
            {columns.length === 0 ? (
              <p className="mt-4 text-sm text-[#676e78]">
                Mentörün açık saati yok. Aşağıdan üç tercih saati girebilirsin.
              </p>
            ) : (
              <div className="mt-4 flex gap-2 overflow-x-auto">
                {columns.map((column, index) => (
                  <div
                    key={column.key}
                    className={`flex min-w-[58px] flex-1 flex-col items-center ${
                      index > 0 ? "border-l border-[#e4e7ea] pl-2" : ""
                    }`}
                  >
                    <p className="text-[11px] font-medium text-[#676e78]">
                      {column.label}
                    </p>
                    <div className="mt-2 flex w-full flex-col gap-1.5">
                      {column.slots.map((slot) => {
                        const time = timeFromStartsAt(slot.startsAt);
                        const selected = preferredTimes.includes(time);
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => {
                              if (!isHalfOrFullHour(time)) return;
                              setPreferredTimes((current) =>
                                assignPreferredTime(current, time),
                              );
                            }}
                            className={`min-h-7 rounded-full px-1 text-[11px] font-medium ${
                              selected
                                ? "bg-[#e86f22] text-white"
                                : "border border-[#e86f22] bg-white text-[#e86f22]"
                            }`}
                          >
                            {slotTimeLabel(slot.startsAt)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 flex items-center gap-2 text-[11px] text-[#858c96]">
              <span className="size-1.5 rounded-full bg-[#e86f22]" />
              Seçilebilir saat
            </p>
            <div className="mt-4 border-t border-[#e4e7ea] pt-3">
              <p className="text-xs font-medium text-[#22262b]">
                Üç tercih saati gir
              </p>
              <p className="mt-1 text-[11px] text-[#858c96]">
                Saatler tam (10:00) veya buçuk (10:30) olmalı.
              </p>
              <div className="mt-2 grid gap-2">
                {preferredTimes.map((time, index) => (
                  <label
                    key={index}
                    className="flex items-center gap-2 text-xs text-[#676e78]"
                  >
                    <span className="w-16">{index + 1}. tercih</span>
                    <input
                      type="time"
                      step={1800}
                      value={time}
                      aria-label={`${index + 1}. tercih saati`}
                      onChange={(event) =>
                        updateTime(index, event.target.value)
                      }
                      className={`min-h-9 flex-1 rounded-lg border px-2.5 text-sm text-[#22262b] outline-none ${
                        time && !isHalfOrFullHour(time)
                          ? "border-red-400"
                          : "border-[#d4d8dd]"
                      }`}
                    />
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[10px] border border-[#e4e7ea] bg-white p-4">
            <h3 className="text-base font-medium text-[#22262b]">
              Talep Özeti
            </h3>
            <div className="mt-3 space-y-2.5 text-xs text-[#676e78]">
              <p className="rounded-lg border border-[#d4d8dd] px-3.5 py-3">
                Mentor: {mentor.fullName}
              </p>
              <p className="rounded-lg border border-[#d4d8dd] px-3.5 py-3">
                Konu: {topic}
              </p>
              <p className="rounded-lg border border-[#d4d8dd] px-3.5 py-3">
                {summaryWhen || "Üç saat seçildiğinde tarih burada görünür"}
                {summaryWhen
                  ? ` · ${durationMinutes} dk · ${mentor.meetingMode || "Online"}`
                  : ""}
              </p>
            </div>
          </section>
        </div>

        {error ? (
          <p role="alert" className="mt-4 text-xs text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>İptal</SecondaryButton>
          <PrimaryButton
            disabled={isSubmitting || !canSend}
            onClick={() => void sendRequest()}
          >
            {isSubmitting ? "Gönderiliyor…" : "Talebi gönder"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
