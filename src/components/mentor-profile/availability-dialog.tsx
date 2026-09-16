"use client";

import Image from "next/image";
import { X } from "lucide-react";

import { ModalDialog } from "@/components/common/modal-dialog";
import { NumberStepper } from "@/components/common/number-stepper";
import { ToggleSwitch } from "@/components/common/toggle-switch";
import { useAvailabilitySettingsForm } from "@/hooks/use-mentor-profile";
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
const pillButtonClass =
  "rounded-full px-[18px] py-2.5 text-[12.5px]! font-medium! leading-[19px]!";
const smallButtonClass = "text-xs! font-medium! leading-[18px]!";

export function AvailabilityDialog({ onClose }: { onClose: () => void }) {
  const availability = useAvailabilitySettingsForm(onClose);
  const { draft } = availability;

  return (
    <ModalDialog
      labelledBy="availability-title"
      onClose={onClose}
      panelClassName="flex max-h-[92vh] w-full max-w-[620px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_16px_48px_rgba(0,0,0,0.18)] outline-none"
    >
      <header className="flex items-center justify-between gap-4 border-b border-[#eceef0] px-6 pb-4 pt-5">
        <div className="flex min-w-0 flex-col gap-[3px]">
          <h2
            id="availability-title"
            className="text-[19px] font-semibold leading-[29px] text-[#22262b]"
          >
            Müsaitliği düzenle
          </h2>
          <p className="text-[12.5px] leading-[19px] text-[#676e78]">
            Startuplar yalnızca açık bıraktığın saatlerde toplantı önerebilir.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Düzenlemeyi kapat"
          className="grid size-5 shrink-0 place-items-center"
        >
          <Image
            src="/mentor-profile/close.svg"
            alt=""
            width={20}
            height={20}
          />
        </button>
      </header>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
        {availability.loadError ? (
          <p role="alert" className="text-xs text-[#a65a15]">
            {availability.loadError}
          </p>
        ) : !draft ? (
          <p className="text-xs text-[#858c96]">Yükleniyor...</p>
        ) : (
          <>
            <section className="flex flex-col gap-2.5">
              <h3 className={sectionLabelClass}>HAFTALIK UYGUNLUK</h3>
              <ul className="flex flex-col gap-2.5">
                {availability.days.map(({ day, label, ranges }) => {
                  const open = ranges.length > 0;
                  return (
                    <li
                      key={day}
                      className="flex min-h-[58px] flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-xl border border-[#e4e7ea] bg-white px-3.5 py-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <ToggleSwitch
                          checked={open}
                          label={`${label} uygun`}
                          onChange={() => availability.toggleDay(day)}
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
                            const name = `${label} ${index + 1}. aralık`;
                            return (
                              <div
                                key={range.key}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="time"
                                  aria-label={`${name} başlangıç`}
                                  value={range.startTime}
                                  onChange={(event) =>
                                    availability.updateRange(
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
                                  aria-label={`${name} bitiş`}
                                  value={range.endTime}
                                  onChange={(event) =>
                                    availability.updateRange(
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
                                    onClick={() => availability.addRange(day)}
                                    aria-label={`${label} için saat aralığı ekle`}
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
                                    onClick={() =>
                                      availability.removeRange(range.key)
                                    }
                                    aria-label={`${name} kaldır`}
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
                          Kapalı
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="flex flex-col gap-2.5">
              <h3 className={sectionLabelClass}>KAPASİTE VE VARSAYILANLAR</h3>
              {AVAILABILITY_NUMBER_FIELDS.map(
                ({ field, label, min, max, unit }) => (
                  <div
                    key={field}
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="text-[13px] leading-5 text-[#4a5059]">
                      {label}
                    </span>
                    <NumberStepper
                      label={label}
                      value={draft[field]}
                      min={min}
                      max={max}
                      unit={unit}
                      onChange={(value) => availability.setNumber(field, value)}
                      onStep={(direction) =>
                        availability.stepNumber(field, direction)
                      }
                    />
                  </div>
                ),
              )}
            </section>

            <section className="flex flex-col gap-2.5">
              <h3 className={sectionLabelClass}>UYGUN OLMADIĞIN TARİHLER</h3>
              <div className="flex flex-wrap items-center gap-2">
                {draft.exceptions.map((item, index) => {
                  const text = exceptionLabel(item);
                  return (
                    <span
                      key={`${item.startsOn}-${item.endsOn}`}
                      className="group relative inline-flex items-center rounded-full border border-[#e4e7ea] bg-[#f3f4f6] px-3 py-[5px] text-xs font-medium leading-[18px] text-[#676e78]"
                    >
                      {text}
                      {/* Hidden until hover or focus so the chip reads as in the design. */}
                      <button
                        type="button"
                        onClick={() => availability.removeException(index)}
                        aria-label={`${text} tarihini kaldır`}
                        className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full border border-[#d4d8dd] bg-white text-[#4a5059] opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <X className="size-2.5" strokeWidth={2.5} />
                      </button>
                    </span>
                  );
                })}
                {availability.isAddingException ? null : (
                  <button
                    type="button"
                    onClick={availability.openExceptionForm}
                    className={`inline-flex items-center gap-1.5 rounded-full border border-[#d4d8dd] bg-white px-3 py-[5px] text-[#26a4ff] ${smallButtonClass}`}
                  >
                    <Image
                      src="/mentor-profile/add-small.svg"
                      alt=""
                      width={14}
                      height={14}
                    />
                    Tarih ekle
                  </button>
                )}
              </div>
              {availability.isAddingException ? (
                <div className="grid gap-2 rounded-xl border border-[#e4e7ea] p-3 sm:grid-cols-3">
                  <input
                    type="date"
                    aria-label="Başlangıç tarihi"
                    value={availability.exception.startsOn}
                    onChange={(event) =>
                      availability.setExceptionField(
                        "startsOn",
                        event.target.value,
                      )
                    }
                    className={fieldClass}
                  />
                  <input
                    type="date"
                    aria-label="Bitiş tarihi"
                    value={availability.exception.endsOn}
                    onChange={(event) =>
                      availability.setExceptionField(
                        "endsOn",
                        event.target.value,
                      )
                    }
                    className={fieldClass}
                  />
                  <input
                    aria-label="İstisna nedeni"
                    value={availability.exception.reason}
                    onChange={(event) =>
                      availability.setExceptionField(
                        "reason",
                        event.target.value,
                      )
                    }
                    placeholder="Neden (isteğe bağlı)"
                    className={fieldClass}
                  />
                  <div className="flex justify-end gap-2 sm:col-span-3">
                    <button
                      type="button"
                      onClick={availability.closeExceptionForm}
                      className={`rounded-full border border-[#d4d8dd] bg-white px-3 py-1.5 text-[#4a5059] ${smallButtonClass}`}
                    >
                      İptal
                    </button>
                    <button
                      type="button"
                      onClick={availability.addException}
                      className={`rounded-full bg-[#26a4ff] px-3 py-1.5 text-white ${smallButtonClass}`}
                    >
                      Tarihi ekle
                    </button>
                  </div>
                </div>
              ) : null}
            </section>
          </>
        )}
        {availability.error ? (
          <p role="alert" className="text-[12px] text-[#a65a15]">
            {availability.error}
          </p>
        ) : null}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eceef0] px-6 pb-5 pt-4">
        <p className="text-xs leading-[18px] text-[#676e78]">
          Değişiklikler yaklaşan görüşmeleri etkilemez.
        </p>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className={`${pillButtonClass} border border-[#d4d8dd] bg-white text-[#4a5059]`}
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={() => void availability.save()}
            disabled={!draft || availability.isSaving}
            className={`${pillButtonClass} bg-[#26a4ff] text-white disabled:opacity-50`}
          >
            {availability.isSaving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </footer>
    </ModalDialog>
  );
}
