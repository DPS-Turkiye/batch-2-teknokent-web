"use client";

import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

import { NumberStepper } from "@/components/common/number-stepper";
import { ToggleSwitch } from "@/components/common/toggle-switch";
import type { WeeklyAvailabilityForm } from "@/hooks/use-weekly-availability-form";
import {
  AVAILABILITY_NUMBER_FIELDS,
  exceptionLabel,
} from "@/lib/mentor-availability";

// globals.css gives buttons and inputs `font: inherit` outside any layer, so
// their type sizes need `!` to take effect.
const sectionLabelClass =
  "text-[11px] font-semibold leading-[17px] text-[#858c96]";
const timeInputClass =
  "h-[38px] w-[86px] rounded-lg border border-[#d4d8dd] bg-white px-3 text-[12.5px]! font-medium! leading-[19px]! text-[#22262b] [&::-webkit-calendar-picker-indicator]:hidden";
const iconButtonClass = "grid size-[18px] shrink-0 place-items-center";
const fieldClass =
  "h-[38px] w-full rounded-lg border border-[#d4d8dd] bg-white px-3 text-[12.5px]! text-[#22262b]";
const smallButtonClass = "text-xs! font-medium! leading-[18px]!";

/**
 * Weekly time ranges, the owner's number fields and unavailable dates, edited through
 * useWeeklyAvailabilityForm. The caller frames it (a dialog, a wizard step) and owns the save
 * button; the owner's source decides which number fields appear.
 */
export function WeeklyAvailabilityEditor({
  editor,
  showUnavailableDates = true,
  className = "",
}: {
  editor: WeeklyAvailabilityForm;
  showUnavailableDates?: boolean;
  className?: string;
}) {
  const t = useTranslations("availabilityEditor");
  const locale = useLocale();
  const { draft } = editor;
  const shownNumberFields = AVAILABILITY_NUMBER_FIELDS.filter((item) =>
    editor.numberFields.includes(item.field),
  );

  return (
    <div className={`flex flex-col gap-5 ${className}`}>
      {editor.loadError ? (
        <p role="alert" className="text-xs text-[#a65a15]">
          {editor.loadError}
        </p>
      ) : !draft ? (
        <p className="text-xs text-[#858c96]">{t("loading")}</p>
      ) : (
        <>
          <section className="flex flex-col gap-2.5">
            <h3 className={sectionLabelClass}>{t("weekly")}</h3>
            <ul className="flex flex-col gap-2.5">
              {editor.days.map(({ day, label, ranges }) => {
                const open = ranges.length > 0;
                return (
                  <li
                    key={day}
                    className="flex min-h-[58px] flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-xl border border-[#e4e7ea] bg-white px-3.5 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <ToggleSwitch
                        checked={open}
                        label={t("dayOpen", { day: label })}
                        onChange={() => editor.toggleDay(day)}
                      />
                      <span
                        className={`w-[84px] text-[13px] font-medium leading-5 ${open ? "text-[#22262b]" : "text-[#858c96]"}`}
                      >
                        {label}
                      </span>
                    </div>
                    {open ? (
                      <div className="ml-auto flex flex-col items-end gap-2">
                        {ranges.map((range, index) => {
                          const first = index === 0;
                          const name = t("range", {
                            day: label,
                            number: index + 1,
                          });
                          return (
                            <div
                              key={range.key}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="time"
                                aria-label={t("rangeStart", { range: name })}
                                value={range.startTime}
                                onChange={(event) =>
                                  editor.updateRange(
                                    range.key,
                                    "startTime",
                                    event.target.value,
                                  )
                                }
                                className={timeInputClass}
                              />
                              <span className="text-[12.5px] leading-[19px] text-[#676e78]">
                                –
                              </span>
                              <input
                                type="time"
                                aria-label={t("rangeEnd", { range: name })}
                                value={range.endTime}
                                onChange={(event) =>
                                  editor.updateRange(
                                    range.key,
                                    "endTime",
                                    event.target.value,
                                  )
                                }
                                className={timeInputClass}
                              />
                              {first ? (
                                <button
                                  type="button"
                                  onClick={() => editor.addRange(day)}
                                  aria-label={t("addRange", { day: label })}
                                  className={iconButtonClass}
                                >
                                  <Image
                                    src="/mentor-profile/add.svg"
                                    alt=""
                                    width={18}
                                    height={18}
                                  />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => editor.removeRange(range.key)}
                                  aria-label={t("removeRange", {
                                    range: name,
                                  })}
                                  className={iconButtonClass}
                                >
                                  <Image
                                    src="/mentor-profile/remove.svg"
                                    alt=""
                                    width={18}
                                    height={18}
                                  />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-[12.5px] leading-[19px] text-[#858c96]">
                        {t("closed")}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          {shownNumberFields.length > 0 ? (
            <section className="flex flex-col gap-2.5">
              <h3 className={sectionLabelClass}>{t("defaults")}</h3>
              {shownNumberFields.map(({ field, min, max, inMinutes }) => (
                <div
                  key={field}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="text-[13px] leading-5 text-[#4a5059]">
                    {editor.numberFieldLabels[field] ?? t(field)}
                  </span>
                  <NumberStepper
                    label={editor.numberFieldLabels[field] ?? t(field)}
                    value={draft[field]}
                    min={min}
                    max={max}
                    unit={inMinutes ? t("minutesUnit") : undefined}
                    onChange={(value) => editor.setNumber(field, value)}
                    onStep={(direction) => editor.stepNumber(field, direction)}
                  />
                </div>
              ))}
            </section>
          ) : null}

          {showUnavailableDates ? (
            <section className="flex flex-col gap-2.5">
              <h3 className={sectionLabelClass}>{t("unavailable")}</h3>
              <div className="flex flex-wrap items-center gap-2">
                {draft.exceptions.map((item, index) => {
                  const text = exceptionLabel(item, locale);
                  return (
                    <span
                      key={`${item.startsOn}-${item.endsOn}`}
                      className="group relative inline-flex items-center rounded-full border border-[#e4e7ea] bg-[#f3f4f6] px-3 py-[5px] text-xs font-medium leading-[18px] text-[#676e78]"
                    >
                      {text}
                      {/* Hidden until hover or focus so the chip reads as in the design. */}
                      <button
                        type="button"
                        onClick={() => editor.removeException(index)}
                        aria-label={t("removeDate", { date: text })}
                        className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full border border-[#d4d8dd] bg-white text-[#4a5059] opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <X className="size-2.5" strokeWidth={2.5} />
                      </button>
                    </span>
                  );
                })}
                {editor.isAddingException ? null : (
                  <button
                    type="button"
                    onClick={editor.openExceptionForm}
                    className={`inline-flex items-center gap-1.5 rounded-full border border-[#d4d8dd] bg-white px-3 py-[5px] text-[#26a4ff] ${smallButtonClass}`}
                  >
                    <Image
                      src="/mentor-profile/add-small.svg"
                      alt=""
                      width={14}
                      height={14}
                    />
                    {t("addDate")}
                  </button>
                )}
              </div>
              {editor.isAddingException ? (
                <div className="grid gap-2 rounded-xl border border-[#e4e7ea] p-3 sm:grid-cols-3">
                  <input
                    type="date"
                    aria-label={t("startDate")}
                    value={editor.exception.startsOn}
                    onChange={(event) =>
                      editor.setExceptionField("startsOn", event.target.value)
                    }
                    className={fieldClass}
                  />
                  <input
                    type="date"
                    aria-label={t("endDate")}
                    value={editor.exception.endsOn}
                    onChange={(event) =>
                      editor.setExceptionField("endsOn", event.target.value)
                    }
                    className={fieldClass}
                  />
                  <input
                    aria-label={t("reason")}
                    value={editor.exception.reason}
                    onChange={(event) =>
                      editor.setExceptionField("reason", event.target.value)
                    }
                    placeholder={t("reasonPlaceholder")}
                    className={fieldClass}
                  />
                  <div className="flex justify-end gap-2 sm:col-span-3">
                    <button
                      type="button"
                      onClick={editor.closeExceptionForm}
                      className={`rounded-full border border-[#d4d8dd] bg-white px-3 py-1.5 text-[#4a5059] ${smallButtonClass}`}
                    >
                      {t("cancelDate")}
                    </button>
                    <button
                      type="button"
                      onClick={editor.addException}
                      className={`rounded-full bg-[#26a4ff] px-3 py-1.5 text-white ${smallButtonClass}`}
                    >
                      {t("confirmDate")}
                    </button>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}
        </>
      )}
      {editor.error ? (
        <p role="alert" className="text-[12px] text-[#a65a15]">
          {editor.error}
        </p>
      ) : null}
    </div>
  );
}
