"use client";

import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { useAppSession } from "@/components/providers/session-provider";
import { useOptionLabel } from "@/hooks/use-option-label";
import type {
  MentorAvailabilitySlot,
  MentorProfile,
} from "@/interfaces/mentor";
import type { StartupContext } from "@/interfaces/startup";
import {
  assignPreferredSlot,
  availabilityColumns,
  emptyPreferredSlots,
  formatPreferredSlot,
  hasPreferredSlots,
  isHalfOrFullHour,
  isValidPreferredSlot,
  preferredSlotKey,
  slotFromStartsAt,
  slotTimeLabel,
  upcomingPreferenceDays,
} from "@/lib/mentor-availability-days";
import { profileMentorshipSubmission } from "@/lib/mentor-profile-request";
import {
  DEFAULT_NEED_GOAL_IDS,
  DEFAULT_NEED_SITUATION_ID,
  messageForNeedGoals,
  needLabels,
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
  const t = useTranslations("mentorRequestDialog");
  const tNeed = useTranslations("mentorRequest");
  const locale = useLocale();
  const optionLabel = useOptionLabel();
  const session = useAppSession();
  const draft = readNeedDraft();
  const labels = needLabels(tNeed);
  // The draft shows in the page's language; left unedited, the Turkish preset is what gets saved.
  const shownProblem = draft
    ? summaryForNeed(
        {
          topicId: draft.topicId,
          otherSummary: draft.otherSummary,
          situationId: draft.situationId ?? DEFAULT_NEED_SITUATION_ID,
          noneSummary: draft.noneSummary ?? "",
        },
        labels,
      )
    : "";
  const shownOutcome = draft
    ? messageForNeedGoals(
        draft.goalIds ?? DEFAULT_NEED_GOAL_IDS,
        draft.goalNote ?? "",
        labels,
      )
    : "";
  const [problem, setProblem] = useState(shownProblem);
  const [outcome, setOutcome] = useState(shownOutcome);
  const [preferredSlots, setPreferredSlots] = useState(emptyPreferredSlots);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const columns = availabilityColumns(slots, new Date(), 5, locale);
  const dayOptions = upcomingPreferenceDays(new Date(), 14, locale);
  const topic =
    (draft
      ? needTitleForSummary(draft.topicId, draft.otherSummary, labels)
      : mentor.specialties[0] &&
        optionLabel("mentorTopic", mentor.specialties[0])) ||
    mentor.professionalTitle;
  const canSend = hasPreferredSlots(preferredSlots);
  const durationMinutes =
    slots.find((slot) => !slot.booked)?.durationMinutes ?? 45;
  const summaryWhen = preferredSlots
    .map((slot) => formatPreferredSlot(slot, locale))
    .filter(Boolean)
    .join(" · ");

  function updateSlot(
    index: number,
    patch: Partial<{ date: string; time: string }>,
  ) {
    setPreferredSlots((current) =>
      current.map((slot, slotIndex) =>
        slotIndex === index ? { ...slot, ...patch } : slot,
      ),
    );
  }

  async function sendRequest() {
    if (!session?.fullName) return;
    if (!canSend) {
      setError(t("needSlots"));
      return;
    }
    const submission = profileMentorshipSubmission({
      mentor,
      startup,
      requestedForName: session.fullName,
      problem: problem === shownProblem ? undefined : problem,
      outcome: outcome === shownOutcome ? undefined : outcome,
      preferredSlots: preferredSlots.filter(isValidPreferredSlot),
    });
    // An empty field falls back to the mentor's title, which not every mentor has.
    if (!submission.summary.trim()) {
      setError(t("needProblem"));
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const saved = await submitMentorshipRequest(submission);
      onSent(saved.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("sendFailed"));
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
            {t("title", { name: mentor.fullName })}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
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
            {t("stuck")}
          </span>
          <textarea
            value={problem}
            onChange={(event) => setProblem(event.target.value)}
            placeholder={t("stuckPlaceholder")}
            className="mt-2.5 min-h-[54px] w-full rounded-lg border border-[#d4d8dd] px-3.5 py-3 text-xs text-[#22262b] outline-none placeholder:text-[#858c96]"
          />
        </label>

        <label className="mt-3 block rounded-[10px] border border-[#e4e7ea] bg-white p-4">
          <span className="text-base font-medium text-[#22262b]">
            {t("outcome")}
          </span>
          <textarea
            value={outcome}
            onChange={(event) => setOutcome(event.target.value)}
            placeholder={t("outcomePlaceholder")}
            className="mt-2.5 min-h-[54px] w-full rounded-lg border border-[#d4d8dd] px-3.5 py-3 text-xs text-[#22262b] outline-none placeholder:text-[#858c96]"
          />
        </label>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(280px,1fr)_minmax(0,1.3fr)]">
          <section className="rounded-[10px] border border-[#e4e7ea] bg-white p-4">
            <h3 className="text-base font-medium text-[#22262b]">
              {t("availability")}
            </h3>
            <p className="mt-1 text-xs text-[#858c96]">{t("nextDays")}</p>
            {columns.length === 0 ? (
              <p className="mt-4 text-sm text-[#676e78]">{t("noSlots")}</p>
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
                        const preference = slotFromStartsAt(slot.startsAt);
                        const selected = preferredSlots.some(
                          (item) =>
                            preferredSlotKey(item) ===
                            preferredSlotKey(preference),
                        );
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => {
                              if (!isHalfOrFullHour(preference.time)) return;
                              setPreferredSlots((current) =>
                                assignPreferredSlot(current, preference),
                              );
                            }}
                            className={`min-h-7 rounded-full px-1 text-[11px] font-medium ${
                              selected
                                ? "bg-[#e86f22] text-white"
                                : "border border-[#e86f22] bg-white text-[#e86f22]"
                            }`}
                          >
                            {slotTimeLabel(slot.startsAt, locale)}
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
              {t("pickable")}
            </p>
            <div className="mt-4 border-t border-[#e4e7ea] pt-3">
              <p className="text-xs font-medium text-[#22262b]">
                {t("enterPreference")}
              </p>
              <p className="mt-1 text-[11px] text-[#858c96]">
                {t("preferenceHint")}
              </p>
              <div className="mt-2 grid gap-2">
                {preferredSlots.map((slot, index) => (
                  <div
                    // eslint-disable-next-line react/no-array-index-key -- a fixed set of preference slots: a slot's position is its identity
                    key={index}
                    className="flex flex-wrap items-center gap-2 text-xs text-[#676e78]"
                  >
                    <span className="w-16">
                      {t("preference", { number: index + 1 })}
                    </span>
                    <select
                      value={slot.date}
                      aria-label={t("preferenceDay", { number: index + 1 })}
                      onChange={(event) =>
                        updateSlot(index, { date: event.target.value })
                      }
                      className="min-h-9 min-w-[132px] flex-1 rounded-lg border border-[#d4d8dd] px-2.5 text-sm text-[#22262b] outline-none"
                    >
                      <option value="">{t("pickDay")}</option>
                      {dayOptions.map((day) => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="time"
                      step={1800}
                      value={slot.time}
                      aria-label={t("preferenceTime", { number: index + 1 })}
                      onChange={(event) =>
                        updateSlot(index, { time: event.target.value })
                      }
                      className={`min-h-9 min-w-[110px] flex-1 rounded-lg border px-2.5 text-sm text-[#22262b] outline-none ${
                        slot.time && !isHalfOrFullHour(slot.time)
                          ? "border-red-400"
                          : "border-[#d4d8dd]"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[10px] border border-[#e4e7ea] bg-white p-4">
            <h3 className="text-base font-medium text-[#22262b]">
              {t("summary")}
            </h3>
            <div className="mt-3 space-y-2.5 text-xs text-[#676e78]">
              <p className="rounded-lg border border-[#d4d8dd] px-3.5 py-3">
                {t("mentor", { name: mentor.fullName })}
              </p>
              <p className="rounded-lg border border-[#d4d8dd] px-3.5 py-3">
                {t("topic", { topic })}
              </p>
              <p className="rounded-lg border border-[#d4d8dd] px-3.5 py-3">
                {summaryWhen
                  ? t("whenDetails", {
                      when: summaryWhen,
                      minutes: durationMinutes,
                      mode: mentor.meetingMode
                        ? optionLabel("meetingFormat", mentor.meetingMode)
                        : t("onlineFallback"),
                    })
                  : t("whenEmpty")}
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
          <SecondaryButton onClick={onClose}>{t("cancel")}</SecondaryButton>
          <PrimaryButton
            disabled={isSubmitting || !canSend}
            onClick={() => void sendRequest()}
          >
            {isSubmitting ? t("sending") : t("send")}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
