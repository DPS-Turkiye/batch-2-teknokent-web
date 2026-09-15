"use client";

import { Plus, X } from "lucide-react";

import { ModalDialog } from "@/components/common/modal-dialog";
import { NumberStepper } from "@/components/common/number-stepper";
import { ToggleSwitch } from "@/components/common/toggle-switch";
import { useAvailabilitySettingsForm } from "@/hooks/use-mentor-profile";
import {
  AVAILABILITY_NUMBER_FIELDS,
  exceptionLabel,
} from "@/lib/mentor-availability";

const sectionLabelClass =
  "text-[10px] font-semibold uppercase tracking-wide text-[#858c96]";
const timeInputClass =
  "h-9 w-[84px] rounded-lg border border-[#d4d8dd] px-2 text-xs text-[#22262b]";
const fieldClass =
  "h-9 w-full rounded-lg border border-[#d4d8dd] px-2 text-xs text-[#22262b]";

export function AvailabilityDialog({ onClose }: { onClose: () => void }) {
  const availability = useAvailabilitySettingsForm(onClose);
  const { draft } = availability;

  return (
    <ModalDialog
      labelledBy="availability-title"
      onClose={onClose}
      panelClassName="flex max-h-[92vh] w-full max-w-[520px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(0,0,0,.22)] outline-none"
    >
      <header className="relative border-b border-[#eef0f3] px-6 pb-4 pt-5">
        <h2
          id="availability-title"
          className="text-[17px] font-semibold text-[#22262b]"
        >
          Müsaitliği düzenle
        </h2>
        <p className="mt-1 pr-8 text-[11.5px] text-[#676e78]">
          Startuplar yalnızca açık bıraktığın saatlerde toplantı önerebilir.
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Düzenlemeyi kapat"
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-md text-[#4a5059] hover:bg-[#f3f4f6]"
        >
          <X className="size-4" />
        </button>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
        {availability.loadError ? (
          <p role="alert" className="text-xs text-[#a65a15]">
            {availability.loadError}
          </p>
        ) : !draft ? (
          <p className="text-xs text-[#858c96]">Yükleniyor...</p>
        ) : (
          <>
            <section>
              <h3 className={`mb-3 ${sectionLabelClass}`}>Haftalık uygunluk</h3>
              <ul className="space-y-2">
                {availability.days.map(({ day, label, ranges }) => (
                  <li
                    key={day}
                    className="rounded-xl border border-[#e4e7ea] px-3 py-2"
                  >
                    {ranges.length === 0 ? (
                      <div className="flex min-h-9 items-center gap-3">
                        <ToggleSwitch
                          checked={false}
                          label={`${label} uygun`}
                          onChange={() => availability.toggleDay(day)}
                        />
                        <span className="flex-1 text-[13px] text-[#676e78]">
                          {label}
                        </span>
                        <span className="text-xs text-[#858c96]">Kapalı</span>
                      </div>
                    ) : (
                      ranges.map((range, index) => {
                        const first = index === 0;
                        const name = `${label} ${index + 1}. aralık`;
                        return (
                          <div
                            key={range.key}
                            className={`flex min-h-9 items-center gap-2 ${first ? "" : "mt-2"}`}
                          >
                            {first ? (
                              <ToggleSwitch
                                checked
                                label={`${label} uygun`}
                                onChange={() => availability.toggleDay(day)}
                              />
                            ) : (
                              <span
                                aria-hidden="true"
                                className="w-9 shrink-0"
                              />
                            )}
                            <span className="ml-1 flex-1 text-[13px] text-[#22262b]">
                              {first ? label : null}
                            </span>
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
                            <span className="text-xs text-[#858c96]">–</span>
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
                                className="grid size-5 shrink-0 place-items-center rounded-full bg-[#26a4ff] text-white"
                              >
                                <Plus className="size-3" strokeWidth={2.5} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  availability.removeRange(range.key)
                                }
                                aria-label={`${name} kaldır`}
                                className="grid size-5 shrink-0 place-items-center rounded-full text-[#858c96] hover:bg-[#f3f4f6]"
                              >
                                <X className="size-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-2.5">
              <h3 className={sectionLabelClass}>Kapasite ve varsayılanlar</h3>
              {AVAILABILITY_NUMBER_FIELDS.map(
                ({ field, label, min, max, unit }) => (
                  <div
                    key={field}
                    className="flex items-center justify-between gap-4 text-[13px] text-[#22262b]"
                  >
                    <span>{label}</span>
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

            <section>
              <h3 className={`mb-3 ${sectionLabelClass}`}>
                Uygun olmadığın tarihler
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                {draft.exceptions.map((item, index) => {
                  const text = exceptionLabel(item);
                  return (
                    <span
                      key={`${item.startsOn}-${item.endsOn}`}
                      className="inline-flex items-center gap-1 rounded-full border border-[#e4e7ea] bg-[#f7f8f9] py-1 pl-3 pr-1 text-xs text-[#4a5059]"
                    >
                      {text}
                      <button
                        type="button"
                        onClick={() => availability.removeException(index)}
                        aria-label={`${text} tarihini kaldır`}
                        className="grid size-5 place-items-center rounded-full hover:bg-[#e4e7ea]"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  );
                })}
                {availability.isAddingException ? null : (
                  <button
                    type="button"
                    onClick={availability.openExceptionForm}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#b9dcf7] px-3 py-1 text-xs font-medium text-[#26a4ff]"
                  >
                    <span className="grid size-4 place-items-center rounded-full bg-[#26a4ff] text-white">
                      <Plus className="size-2.5" strokeWidth={3} />
                    </span>
                    Tarih ekle
                  </button>
                )}
              </div>
              {availability.isAddingException ? (
                <div className="mt-3 grid gap-2 rounded-xl border border-[#e4e7ea] p-3 sm:grid-cols-3">
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
                      className="rounded-full border border-[#d4d8dd] px-3 py-1.5 text-xs"
                    >
                      İptal
                    </button>
                    <button
                      type="button"
                      onClick={availability.addException}
                      className="rounded-full bg-[#26a4ff] px-3 py-1.5 text-xs font-medium text-white"
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

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef0f3] px-6 py-4">
        <p className="text-[11px] text-[#858c96]">
          Değişiklikler yaklaşan görüşmeleri etkilemez.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#d4d8dd] px-5 py-2 text-[12.5px]"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={() => void availability.save()}
            disabled={!draft || availability.isSaving}
            className="rounded-full bg-[#26a4ff] px-5 py-2 text-[12.5px] font-medium text-white disabled:opacity-50"
          >
            {availability.isSaving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </footer>
    </ModalDialog>
  );
}
