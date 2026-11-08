"use client";

import { useLocale, useTranslations } from "next-intl";

import { PreferredTimesPicker } from "@/components/office-hours/preferred-times-picker";
import {
  useOfficeHoursRequestCard,
  type DecisionMode,
  type OfficeHoursRequestCardState,
} from "@/hooks/use-office-hours-request-card";
import {
  OfficeHoursMessageType,
  OfficeHoursRequestStatus,
  type OfficeHoursRequest,
  type OfficeHoursRole,
} from "@/interfaces/office-hours";
import { meetingTimeLabel, slotLabel } from "@/lib/office-hours-booking";

const STATUS_TONE: Record<OfficeHoursRequestStatus, string> = {
  [OfficeHoursRequestStatus.Pending]: "bg-[#fff4ec] text-[#c2561a]",
  [OfficeHoursRequestStatus.Accepted]: "bg-[#eef7f0] text-[#3f7d5a]",
  [OfficeHoursRequestStatus.Declined]: "bg-[#f4f5f7] text-[#676e78]",
  [OfficeHoursRequestStatus.MoreInfoRequested]: "bg-[#f2f8fc] text-[#1592ea]",
  [OfficeHoursRequestStatus.CounterProposed]: "bg-[#f2f8fc] text-[#1592ea]",
  [OfficeHoursRequestStatus.Withdrawn]: "bg-[#f4f5f7] text-[#676e78]",
};

const DECISION_PLACEHOLDER: Record<
  DecisionMode,
  "messagePlaceholder" | "declineReason" | "questionPlaceholder"
> = {
  accept: "messagePlaceholder",
  propose: "messagePlaceholder",
  decline: "declineReason",
  question: "questionPlaceholder",
};

const DECISION_BUTTONS: {
  mode: DecisionMode;
  label: "accept" | "propose" | "askQuestion" | "decline";
  primary?: true;
}[] = [
  { mode: "accept", label: "accept", primary: true },
  { mode: "propose", label: "propose" },
  { mode: "question", label: "askQuestion" },
  { mode: "decline", label: "decline" },
];

const MESSAGE_AUTHOR: Record<OfficeHoursMessageType, "question" | "answer"> = {
  [OfficeHoursMessageType.InstructorQuestion]: "question",
  [OfficeHoursMessageType.StudentReply]: "answer",
};

const buttonClass =
  "rounded-full border border-[#d4d8dd] px-3.5 py-1.5 text-[12.5px] font-medium text-[#22262b] hover:bg-[#f8f9fa] disabled:opacity-50";
const primaryClass =
  "rounded-full bg-[#e86f22] px-3.5 py-1.5 text-[12.5px] font-medium text-white hover:bg-[#ce5e19] disabled:bg-[#c9cdd2]";
const fieldClass =
  "mt-2 w-full rounded-lg border border-[#d4d8dd] px-3 py-2 text-sm text-[#22262b] outline-none placeholder:text-[#858c96]";

type CardProps = {
  request: OfficeHoursRequest;
  card: OfficeHoursRequestCardState;
};

function RequestTimes({ request }: { request: OfficeHoursRequest }) {
  const t = useTranslations("officeHours.booking");
  const locale = useLocale();
  if (request.meeting) {
    return (
      <p className="mt-3 text-[13px] font-medium text-[#3f7d5a]">
        {t("meetingAt", {
          time: meetingTimeLabel(request.meeting.startsAt, locale),
          minutes: request.meeting.durationMinutes,
        })}
      </p>
    );
  }
  return (
    <p className="mt-3 text-[12.5px] text-[#4a5059]">
      <span className="text-[#858c96]">{t("asked")}: </span>
      {request.preferredSlots
        .map((slot) => slotLabel(slot, locale))
        .join(" · ")}
    </p>
  );
}

function RequestNotes({ request }: { request: OfficeHoursRequest }) {
  const t = useTranslations("officeHours.booking");
  return (
    <>
      {request.instructorMessage && (
        <p className="mt-2 text-[12.5px] text-[#4a5059]">
          {t("note", { message: request.instructorMessage })}
        </p>
      )}
      {request.rejectionReason && (
        <p className="mt-2 text-[12.5px] text-[#4a5059]">
          {t("rejection", { reason: request.rejectionReason })}
        </p>
      )}
      {request.messages.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5 rounded-lg bg-[#f8f9fa] p-3 text-[12.5px] text-[#4a5059]">
          {request.messages.map((message) => (
            <li key={message.id}>
              <span className="text-[#858c96]">
                {t(MESSAGE_AUTHOR[message.type])}:{" "}
              </span>
              {message.body}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function ProposedTimes({ request, card }: CardProps) {
  const t = useTranslations("officeHours.booking");
  const locale = useLocale();
  return (
    <div className="mt-3">
      <p className="text-[12.5px] text-[#858c96]">{t("proposed")}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {request.proposedSlots.map((slot) => (
          <button
            key={slot}
            type="button"
            disabled={card.isPending}
            onClick={() => void card.takeProposed(slot)}
            className={primaryClass}
            aria-label={`${t("takeTime")}: ${slotLabel(slot, locale)}`}
          >
            {slotLabel(slot, locale)}
          </button>
        ))}
      </div>
    </div>
  );
}

function ReplyForm({ card }: { card: OfficeHoursRequestCardState }) {
  const t = useTranslations("officeHours.booking");
  return (
    <div className="mt-3">
      <textarea
        value={card.text}
        onChange={(event) => card.setText(event.target.value)}
        placeholder={t("replyPlaceholder")}
        aria-label={t("replyPlaceholder")}
        className={fieldClass}
      />
      <button
        type="button"
        disabled={card.isPending || !card.text.trim()}
        onClick={() => void card.reply()}
        className={`${primaryClass} mt-2`}
      >
        {t("sendReply")}
      </button>
    </div>
  );
}

function DecisionButtons({ card }: { card: OfficeHoursRequestCardState }) {
  const t = useTranslations("officeHours.booking");
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {DECISION_BUTTONS.map(({ mode, label, primary }) => (
        <button
          key={mode}
          type="button"
          onClick={() => card.open(mode)}
          className={primary ? primaryClass : buttonClass}
        >
          {t(label)}
        </button>
      ))}
    </div>
  );
}

function AcceptTimePicker({ request, card }: CardProps) {
  const t = useTranslations("officeHours.booking");
  const locale = useLocale();
  return (
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
              checked={card.acceptSlot === slot}
              onChange={() => card.setAcceptSlot(slot)}
            />
            {slotLabel(slot, locale)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ProposeTimesPicker({ card }: { card: OfficeHoursRequestCardState }) {
  const t = useTranslations("officeHours.booking");
  return (
    <>
      <p className="mb-2 text-[12px] text-[#858c96]">{t("proposeHint")}</p>
      <PreferredTimesPicker
        slots={card.ownSlots}
        value={card.proposed}
        onChange={card.setProposed}
      />
    </>
  );
}

function DecisionPanel({
  request,
  card,
  mode,
}: CardProps & { mode: DecisionMode }) {
  const t = useTranslations("officeHours.booking");
  const placeholder = t(DECISION_PLACEHOLDER[mode]);
  return (
    <div className="mt-4 rounded-lg border border-[#eceef0] p-3">
      {mode === "accept" && <AcceptTimePicker request={request} card={card} />}
      {mode === "propose" && <ProposeTimesPicker card={card} />}
      <textarea
        value={card.text}
        onChange={(event) => card.setText(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={fieldClass}
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={
            card.isPending || (mode === "question" && !card.text.trim())
          }
          onClick={card.submitDecision}
          className={primaryClass}
        >
          {t("send")}
        </button>
        <button type="button" onClick={card.close} className={buttonClass}>
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}

export function OfficeHoursRequestCard({
  request,
  viewer,
}: {
  request: OfficeHoursRequest;
  viewer: OfficeHoursRole;
}) {
  const t = useTranslations("officeHours.booking");
  const card = useOfficeHoursRequestCard(request, viewer);

  return (
    <li className="rounded-2xl border border-[#e4e7ea] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[12.5px] text-[#676e78]">
            {t("with", { name: card.other.fullName })}
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

      {request.expectedOutcome && (
        <p className="mt-2 text-[12.5px] text-[#4a5059]">
          {t("outcome", { outcome: request.expectedOutcome })}
        </p>
      )}
      <RequestTimes request={request} />
      <RequestNotes request={request} />

      {card.can.takeProposed && <ProposedTimes request={request} card={card} />}
      {card.can.reply && <ReplyForm card={card} />}
      {card.can.withdraw && (
        <button
          type="button"
          disabled={card.isPending}
          onClick={() => void card.withdraw()}
          className={`${buttonClass} mt-3`}
        >
          {t("withdraw")}
        </button>
      )}
      {card.can.decide && card.mode === null && <DecisionButtons card={card} />}
      {card.can.decide && card.mode !== null && (
        <DecisionPanel request={request} card={card} mode={card.mode} />
      )}

      {card.error && (
        <p role="alert" className="mt-2 text-[12.5px] text-[#b42318]">
          {card.error}
        </p>
      )}
    </li>
  );
}
