"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { ToggleSwitch } from "@/components/common/toggle-switch";
import {
  ONBOARDING_TONES,
  OnboardingTone,
} from "@/components/onboarding/onboarding-tone";
import {
  OnboardingCard,
  OnboardingChips,
} from "@/components/onboarding/onboarding-ui";
import type { MentorOnboarding } from "@/hooks/use-mentor-onboarding";
import { useOptionLabel } from "@/hooks/use-option-label";
import { MeetingFrequency, WEEKDAY_ORDER } from "@/interfaces/mentor";
import {
  CAPACITY_MAX,
  CAPACITY_MIN,
  MEETING_BUFFER_OPTIONS,
  MEETING_DURATION_OPTIONS,
  MEETING_FORMAT_OPTIONS,
  RESPONSE_TIME_OPTIONS,
} from "@/interfaces/mentor-onboarding";
import { isEnumValue } from "@/lib/enum";

const TONE = OnboardingTone.Mentor;
const focus = ONBOARDING_TONES[TONE].focus;
const smallInput = `h-[38px] rounded-lg border border-[#d4d8dd] bg-white px-3 text-[12.5px] font-medium text-[#22262b] outline-none ${focus}`;

function SettingRow({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={id} className="text-[13px] leading-5 text-[#4a5059]">
        {label}
      </label>
      <div className="w-[140px] shrink-0">{children}</div>
    </div>
  );
}

export function MentorAvailabilityStep({
  wizard,
}: {
  wizard: MentorOnboarding;
}) {
  const copy = useTranslations("mentorAvailability");
  const tOptions = useTranslations("options");
  const optionLabel = useOptionLabel();
  const { draft, update, updateDay } = wizard;

  return (
    <>
      <OnboardingCard
        rounded="rounded-xl"
        title={copy("weekly")}
        subtitle={copy("weeklySubtitle")}
      >
        <ul className="flex flex-col gap-4">
          {WEEKDAY_ORDER.map((day) => {
            const slot = draft.week[day];
            const invalid = wizard.invalidDays.includes(day);
            return (
              <li
                key={day}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 ${
                  slot.enabled
                    ? "border-[#e4e7ea] bg-white"
                    : "border-[#e4e7ea] bg-[#f8f9fa]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <ToggleSwitch
                    checked={slot.enabled}
                    label={copy("dayAvailable", {
                      day: tOptions(`weekday.${day}`),
                    })}
                    onChange={() => updateDay(day, { enabled: !slot.enabled })}
                  />
                  <span
                    className={`w-[88px] text-[13px] font-medium leading-5 ${
                      slot.enabled ? "text-[#22262b]" : "text-[#858c96]"
                    }`}
                  >
                    {tOptions(`weekday.${day}`)}
                  </span>
                </div>
                {slot.enabled ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      step={900}
                      aria-label={copy("dayStart", {
                        day: tOptions(`weekday.${day}`),
                      })}
                      className={`${smallInput} w-[84px] text-center`}
                      value={slot.start}
                      onChange={(event) =>
                        updateDay(day, { start: event.target.value })
                      }
                    />
                    <span className="text-[12.5px] text-[#676e78]">–</span>
                    <input
                      type="time"
                      step={900}
                      aria-label={copy("dayEnd", {
                        day: tOptions(`weekday.${day}`),
                      })}
                      className={`${smallInput} w-[84px] text-center`}
                      value={slot.end}
                      onChange={(event) =>
                        updateDay(day, { end: event.target.value })
                      }
                    />
                  </div>
                ) : (
                  <span className="text-[12.5px] text-[#858c96]">Kapalı</span>
                )}
                {invalid ? (
                  <p role="alert" className="w-full text-xs text-[#b42318]">
                    {copy("endAfterStart")}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </OnboardingCard>

      <OnboardingCard
        rounded="rounded-xl"
        title={copy("capacity")}
        subtitle={copy("capacitySubtitle")}
      >
        <SettingRow id="mentor-capacity" label={copy("capacityLimit")}>
          <div className="flex items-center gap-2">
            <input
              id="mentor-capacity"
              type="number"
              min={CAPACITY_MIN}
              max={CAPACITY_MAX}
              className={`${smallInput} w-[64px]`}
              value={draft.capacity}
              onChange={(event) =>
                update(
                  "capacity",
                  Math.min(
                    CAPACITY_MAX,
                    Math.max(
                      CAPACITY_MIN,
                      Number(event.target.value) || CAPACITY_MIN,
                    ),
                  ),
                )
              }
            />
            <span className="text-[12.5px] font-medium text-[#22262b]">
              {copy("startupUnit")}
            </span>
          </div>
        </SettingRow>
        <SettingRow id="mentor-duration" label={copy("duration")}>
          <select
            id="mentor-duration"
            className={`${smallInput} w-full`}
            value={draft.durationMinutes}
            onChange={(event) =>
              update("durationMinutes", Number(event.target.value))
            }
          >
            {MEETING_DURATION_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} dk
              </option>
            ))}
          </select>
        </SettingRow>
        <SettingRow id="mentor-frequency" label={copy("frequency")}>
          <select
            id="mentor-frequency"
            className={`${smallInput} w-full`}
            value={draft.frequency}
            onChange={(event) => {
              const { value } = event.target;
              if (isEnumValue(MeetingFrequency, value)) {
                update("frequency", value);
              }
            }}
          >
            {Object.values(MeetingFrequency).map((frequency) => (
              <option key={frequency} value={frequency}>
                {tOptions(`meetingFrequency.${frequency}`)}
              </option>
            ))}
          </select>
        </SettingRow>
        <SettingRow id="mentor-buffer" label={copy("buffer")}>
          <select
            id="mentor-buffer"
            className={`${smallInput} w-full`}
            value={draft.bufferMinutes}
            onChange={(event) =>
              update("bufferMinutes", Number(event.target.value))
            }
          >
            {MEETING_BUFFER_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} dk
              </option>
            ))}
          </select>
        </SettingRow>
      </OnboardingCard>

      <OnboardingCard rounded="rounded-xl" title={copy("formatTitle")}>
        <p className="text-[12.5px] font-medium leading-[19px] text-[#4a5059]">
          {copy("format")}
        </p>
        <OnboardingChips
          tone={TONE}
          label={copy("formatLabel")}
          options={MEETING_FORMAT_OPTIONS}
          selected={[draft.format as (typeof MEETING_FORMAT_OPTIONS)[number]]}
          onToggle={(value) => update("format", value)}
          labelFor={(value) => optionLabel("meetingFormat", value)}
        />
        <p className="text-[12.5px] font-medium leading-[19px] text-[#4a5059]">
          {copy("responseQuestion")}
        </p>
        <OnboardingChips
          tone={TONE}
          label={copy("responseLabel")}
          options={RESPONSE_TIME_OPTIONS}
          selected={[
            draft.responseTime as (typeof RESPONSE_TIME_OPTIONS)[number],
          ]}
          onToggle={(value) => update("responseTime", value)}
          labelFor={(value) => optionLabel("responseTime", value)}
        />
      </OnboardingCard>
    </>
  );
}
