"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { PreferredTimesPicker } from "@/components/office-hours/preferred-times-picker";
import { useToast } from "@/components/providers/toast-provider";
import {
  useInstructorSlots,
  useOfficeHoursRequestAction,
} from "@/hooks/use-office-hours-booking";
import {
  OfficeHoursMessageType,
  OfficeHoursRequestStatus,
  OfficeHoursRole,
  type OfficeHoursRequest,
} from "@/interfaces/office-hours";
import type { OfficeHoursRequestAction } from "@/lib/client/office-hours-booking";
import {
  emptyPreferredSlots,
  hasPreferredSlots,
  isValidPreferredSlot,
  preferredSlotMachineValue,
} from "@/lib/mentor-availability-days";
import {
  asAvailabilitySlots,
  meetingTimeLabel,
  slotLabel,
} from "@/lib/office-hours-booking";
import { errorMessage } from "@/lib/utils";

const STATUS_TONE: Record<OfficeHoursRequestStatus, string> = {
  [OfficeHoursRequestStatus.Pending]: "bg-[#fff4ec] text-[#c2561a]",
  [OfficeHoursRequestStatus.Accepted]: "bg-[#eef7f0] text-[#3f7d5a]",
  [OfficeHoursRequestStatus.Declined]: "bg-[#f4f5f7] text-[#676e78]",
  [OfficeHoursRequestStatus.MoreInfoRequested]: "bg-[#f2f8fc] text-[#1592ea]",
  [OfficeHoursRequestStatus.CounterProposed]: "bg-[#f2f8fc] text-[#1592ea]",
  [OfficeHoursRequestStatus.Withdrawn]: "bg-[#f4f5f7] text-[#676e78]",
};

const OPEN = new Set([
  OfficeHoursRequestStatus.Pending,
  OfficeHoursRequestStatus.MoreInfoRequested,
  OfficeHoursRequestStatus.CounterProposed,
]);

type Mode = "accept" | "decline" | "question" | "propose" | null;

const buttonClass =
  "rounded-full border border-[#d4d8dd] px-3.5 py-1.5 text-[12.5px] font-medium text-[#22262b] hover:bg-[#f8f9fa] disabled:opacity-50";
const primaryClass =
  "rounded-full bg-[#e86f22] px-3.5 py-1.5 text-[12.5px] font-medium text-white hover:bg-[#ce5e19] disabled:bg-[#c9cdd2]";
const fieldClass =
  "mt-2 w-full rounded-lg border border-[#d4d8dd] px-3 py-2 text-sm text-[#22262b] outline-none placeholder:text-[#858c96]";

/** One request as the student or the academic sees it, with what each can do next. */
export function OfficeHoursRequestCard({
  request,
  viewer,
}: {
  request: OfficeHoursRequest;
  viewer: OfficeHoursRole;
}) {
  const t = useTranslations("officeHours.booking");
  const locale = useLocale();
  const { showToast } = useToast();
  const act = useOfficeHoursRequestAction(request.courseId);
  const [mode, setMode] = useState<Mode>(null);
  const [text, setText] = useState("");
  const [acceptSlot, setAcceptSlot] = useState(request.preferredSlots[0] ?? "");
  const [proposed, setProposed] = useState(emptyPreferredSlots);
  const [error, setError] = useState("");
  const instructor = viewer === OfficeHoursRole.Instructor;
  const ownSlots = useInstructorSlots(
    request.courseId,
    instructor && mode === "propose" ? request.instructor.id : null,
  );
  const other = instructor ? request.student : request.instructor;
  const question = [...request.messages]
    .reverse()
    .find(
      (message) => message.type === OfficeHoursMessageType.InstructorQuestion,
    );
  const canDecide =
    instructor &&
    (request.status === OfficeHoursRequestStatus.Pending ||
      request.status === OfficeHoursRequestStatus.MoreInfoRequested);

  async function run(action: OfficeHoursRequestAction) {
    setError("");
    try {
      await act.mutateAsync({ requestId: request.id, action });
      setMode(null);
      setText("");
      showToast({ message: t("done"), tone: "success" });
    } catch (actionError) {
      setError(errorMessage(actionError, t("failed")));
    }
  }

  function submitDecision() {
    if (mode === "accept") {
      void run({
        kind: "decision",
        payload: {
          status: OfficeHoursRequestStatus.Accepted,
          slot: acceptSlot,
          message: text.trim() || undefined,
        },
      });
    } else if (mode === "decline") {
      void run({
        kind: "decision",
        payload: {
          status: OfficeHoursRequestStatus.Declined,
          message: text.trim() || undefined,
        },
      });
    } else if (mode === "question") {
      if (!text.trim()) return;
      void run({
        kind: "decision",
        payload: {
          status: OfficeHoursRequestStatus.MoreInfoRequested,
          message: text.trim(),
        },
      });
    } else if (mode === "propose") {
      if (!hasPreferredSlots(proposed)) {
        setError(t("proposeHint"));
        return;
      }
      void run({
        kind: "decision",
        payload: {
          status: OfficeHoursRequestStatus.CounterProposed,
          proposedSlots: proposed
            .filter(isValidPreferredSlot)
            .map(preferredSlotMachineValue),
          message: text.trim() || undefined,
        },
      });
    }
  }

  return (
    <li className="rounded-2xl border border-[#e4e7ea] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[12.5px] text-[#676e78]">
            {t("with", { name: other.fullName })}
          </p>
          <p className="mt-0.5 text-sm font-medium text-[#22262b]">
            {request.topic}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-medium ${STATUS_TONE[request.status]}`}
        >
          {t(`status.${request.status}`)}
        </span>
      </div>

      {request.expectedOutcome ? (
        <p className="mt-2 text-[12.5px] text-[#4a5059]">
          {t("outcome", { outcome: request.expectedOutcome })}
        </p>
      ) : null}

      {request.meeting ? (
        <p className="mt-3 text-[13px] font-medium text-[#3f7d5a]">
          {t("meetingAt", {
            time: meetingTimeLabel(request.meeting.startsAt, locale),
            minutes: request.meeting.durationMinutes,
          })}
        </p>
      ) : (
        <p className="mt-3 text-[12.5px] text-[#4a5059]">
          <span className="text-[#858c96]">{t("asked")}: </span>
          {request.preferredSlots
            .map((slot) => slotLabel(slot, locale))
            .join(" · ")}
        </p>
      )}

      {request.instructorMessage ? (
        <p className="mt-2 text-[12.5px] text-[#4a5059]">
          {t("note", { message: request.instructorMessage })}
        </p>
      ) : null}
      {request.rejectionReason ? (
        <p className="mt-2 text-[12.5px] text-[#4a5059]">
          {t("rejection", { reason: request.rejectionReason })}
        </p>
      ) : null}
      {request.messages.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1.5 rounded-lg bg-[#f8f9fa] p-3 text-[12.5px] text-[#4a5059]">
          {request.messages.map((message) => (
            <li key={message.id}>
              <span className="text-[#858c96]">
                {message.type === OfficeHoursMessageType.InstructorQuestion
                  ? t("question")
                  : t("answer")}
                :{" "}
              </span>
              {message.body}
            </li>
          ))}
        </ul>
      ) : null}

      {!instructor &&
      request.status === OfficeHoursRequestStatus.CounterProposed ? (
        <div className="mt-3">
          <p className="text-[12.5px] text-[#858c96]">{t("proposed")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {request.proposedSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                disabled={act.isPending}
                onClick={() =>
                  void run({ kind: "accept-proposed", payload: { slot } })
                }
                className={primaryClass}
                aria-label={`${t("takeTime")}: ${slotLabel(slot, locale)}`}
              >
                {slotLabel(slot, locale)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {!instructor &&
      request.status === OfficeHoursRequestStatus.MoreInfoRequested &&
      question ? (
        <div className="mt-3">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t("replyPlaceholder")}
            aria-label={t("replyPlaceholder")}
            className={fieldClass}
          />
          <button
            type="button"
            disabled={act.isPending || !text.trim()}
            onClick={() =>
              void run({ kind: "reply", payload: { message: text.trim() } })
            }
            className={`${primaryClass} mt-2`}
          >
            {t("sendReply")}
          </button>
        </div>
      ) : null}

      {!instructor && OPEN.has(request.status) ? (
        <button
          type="button"
          disabled={act.isPending}
          onClick={() => void run({ kind: "withdraw" })}
          className={`${buttonClass} mt-3`}
        >
          {t("withdraw")}
        </button>
      ) : null}

      {canDecide && mode === null ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("accept")}
            className={primaryClass}
          >
            {t("accept")}
          </button>
          <button
            type="button"
            onClick={() => setMode("propose")}
            className={buttonClass}
          >
            {t("propose")}
          </button>
          <button
            type="button"
            onClick={() => setMode("question")}
            className={buttonClass}
          >
            {t("askQuestion")}
          </button>
          <button
            type="button"
            onClick={() => setMode("decline")}
            className={buttonClass}
          >
            {t("decline")}
          </button>
        </div>
      ) : null}

      {canDecide && mode !== null ? (
        <div className="mt-4 rounded-lg border border-[#eceef0] p-3">
          {mode === "accept" ? (
            <fieldset>
              <legend className="text-[12.5px] font-medium text-[#22262b]">
                {t("pickTime")}
              </legend>
              <div className="mt-2 flex flex-col gap-1.5">
                {request.preferredSlots.map((slot) => (
                  <label
                    key={slot}
                    className="flex items-center gap-2 text-[12.5px] text-[#4a5059]"
                  >
                    <input
                      type="radio"
                      name={`accept-${request.id}`}
                      checked={acceptSlot === slot}
                      onChange={() => setAcceptSlot(slot)}
                    />
                    {slotLabel(slot, locale)}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}
          {mode === "propose" ? (
            <>
              <p className="mb-2 text-[12px] text-[#858c96]">
                {t("proposeHint")}
              </p>
              <PreferredTimesPicker
                slots={asAvailabilitySlots(ownSlots.data ?? [])}
                value={proposed}
                onChange={setProposed}
              />
            </>
          ) : null}
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={
              mode === "question"
                ? t("questionPlaceholder")
                : mode === "decline"
                  ? t("declineReason")
                  : t("messagePlaceholder")
            }
            aria-label={
              mode === "question"
                ? t("questionPlaceholder")
                : mode === "decline"
                  ? t("declineReason")
                  : t("messagePlaceholder")
            }
            className={fieldClass}
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={act.isPending || (mode === "question" && !text.trim())}
              onClick={submitDecision}
              className={primaryClass}
            >
              {t("send")}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode(null);
                setError("");
              }}
              className={buttonClass}
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-2 text-[12.5px] text-[#b42318]">
          {error}
        </p>
      ) : null}
    </li>
  );
}
