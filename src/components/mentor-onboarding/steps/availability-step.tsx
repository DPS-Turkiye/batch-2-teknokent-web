"use client";

import type { ReactNode } from "react";

import { ToggleSwitch } from "@/components/common/toggle-switch";
import {
  OnboardingCard,
  OnboardingChips,
} from "@/components/onboarding/onboarding-ui";
import {
  ONBOARDING_TONES,
  OnboardingTone,
} from "@/components/onboarding/onboarding-tone";
import type { MentorOnboarding } from "@/hooks/use-mentor-onboarding";
import {
  MEETING_FREQUENCY_LABELS,
  MeetingFrequency,
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
} from "@/interfaces/mentor";
import {
  CAPACITY_MAX,
  CAPACITY_MIN,
  MEETING_BUFFER_OPTIONS,
  MEETING_DURATION_OPTIONS,
  MEETING_FORMAT_OPTIONS,
  RESPONSE_TIME_OPTIONS,
} from "@/interfaces/mentor-onboarding";

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
  const { draft, update, updateDay } = wizard;

  return (
    <>
      <OnboardingCard
        rounded="rounded-xl"
        title="Haftalık uygunluk"
        subtitle="Tekrarlayan uygunluk. Tek seferlik değişiklikleri sonradan takvimden yapabilirsin."
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
                    label={`${WEEKDAY_LABELS[day]} uygun`}
                    onChange={() => updateDay(day, { enabled: !slot.enabled })}
                  />
                  <span
                    className={`w-[88px] text-[13px] font-medium leading-5 ${
                      slot.enabled ? "text-[#22262b]" : "text-[#858c96]"
                    }`}
                  >
                    {WEEKDAY_LABELS[day]}
                  </span>
                </div>
                {slot.enabled ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      step={900}
                      aria-label={`${WEEKDAY_LABELS[day]} başlangıç`}
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
                      aria-label={`${WEEKDAY_LABELS[day]} bitiş`}
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
                    Bitiş saati başlangıçtan sonra olmalı.
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </OnboardingCard>

      <OnboardingCard
        rounded="rounded-xl"
        title="Kapasite"
        subtitle="Aynı anda kaç startupla çalışabileceğini belirle. Limit dolduğunda yeni talep gelmez."
      >
        <SettingRow id="mentor-capacity" label="Eş zamanlı mentorluk limiti">
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
              startup
            </span>
          </div>
        </SettingRow>
        <SettingRow id="mentor-duration" label="Varsayılan görüşme süresi">
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
        <SettingRow id="mentor-frequency" label="Görüşme sıklığı tercihin">
          <select
            id="mentor-frequency"
            className={`${smallInput} w-full`}
            value={draft.frequency}
            onChange={(event) =>
              update("frequency", event.target.value as MeetingFrequency)
            }
          >
            {Object.values(MeetingFrequency).map((frequency) => (
              <option key={frequency} value={frequency}>
                {MEETING_FREQUENCY_LABELS[frequency]}
              </option>
            ))}
          </select>
        </SettingRow>
        <SettingRow id="mentor-buffer" label="İki görüşme arası tampon">
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

      <OnboardingCard
        rounded="rounded-xl"
        title="Görüşme formatı ve yanıt süresi"
      >
        <p className="text-[12.5px] font-medium leading-[19px] text-[#4a5059]">
          Format
        </p>
        <OnboardingChips
          tone={TONE}
          label="Görüşme formatı"
          options={MEETING_FORMAT_OPTIONS}
          selected={[draft.format as (typeof MEETING_FORMAT_OPTIONS)[number]]}
          onToggle={(value) => update("format", value)}
        />
        <p className="text-[12.5px] font-medium leading-[19px] text-[#4a5059]">
          Taleplere genellikle ne kadar sürede yanıt verirsin?
        </p>
        <OnboardingChips
          tone={TONE}
          label="Yanıt süresi"
          options={RESPONSE_TIME_OPTIONS}
          selected={[
            draft.responseTime as (typeof RESPONSE_TIME_OPTIONS)[number],
          ]}
          onToggle={(value) => update("responseTime", value)}
        />
      </OnboardingCard>
    </>
  );
}
