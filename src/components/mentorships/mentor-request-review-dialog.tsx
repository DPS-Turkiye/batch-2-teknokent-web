"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { TranscribeRequestedField } from "@/components/meetings/transcribe-requested-field";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { DocumentRequestTitleEditor } from "@/components/mentorships/document-request-title-editor";
import { RequestDetailsPanel } from "@/components/mentorships/request-details-panel";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import {
  emptyPreferredSlot,
  hasProposedSlots,
  isHalfOrFullHour,
  isValidPreferredSlot,
  MAX_PROPOSED_SLOT_COUNT,
  parsePreferredSlotsFromMessage,
  preferredSlotKey,
  upcomingPreferenceDays,
  type ParsedPreferredSlot,
  type PreferredSlot,
} from "@/lib/mentor-availability-days";
import {
  mentorWorkspaceName,
  mentorWorkspacePerson,
} from "@/lib/mentorship-workspace";

type ReviewMode = "accept" | "propose";

export function MentorRequestReviewDialog({
  request,
  isPending,
  error,
  onClose,
  onAccept,
  onPropose,
}: {
  request: MentorshipRequest;
  isPending: boolean;
  error: string;
  onClose: () => void;
  onAccept: (
    slot: ParsedPreferredSlot | null,
    meetLink: string,
    transcribeRequested: boolean,
    requestedDocuments: string[],
  ) => void;
  onPropose: (slots: PreferredSlot[], requestedDocuments: string[]) => void;
}) {
  const slots = parsePreferredSlotsFromMessage(request.requesterMessage);
  const dayOptions = upcomingPreferenceDays();
  const [mode, setMode] = useState<ReviewMode>("accept");
  const [selectedKey, setSelectedKey] = useState("");
  const [meetLink, setMeetLink] = useState("");
  const [transcribeRequested, setTranscribeRequested] = useState(false);
  const [documentTitles, setDocumentTitles] = useState<string[]>([]);
  const [proposedSlots, setProposedSlots] = useState<PreferredSlot[]>([
    emptyPreferredSlot(),
  ]);
  const selected = slots.find(
    (slot) => (preferredSlotKey(slot) || slot.label) === selectedKey,
  );
  const person = mentorWorkspacePerson(request);
  const canAccept = slots.length === 0 || Boolean(selected);
  const canPropose = hasProposedSlots(proposedSlots);

  function updateProposedSlot(index: number, patch: Partial<PreferredSlot>) {
    setProposedSlots((current) =>
      current.map((slot, slotIndex) =>
        slotIndex === index ? { ...slot, ...patch } : slot,
      ),
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#32373e]/70 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-labelledby="mentor-request-review-title"
        className="max-h-[90vh] w-full max-w-[720px] overflow-y-auto rounded-3xl bg-white p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[#858c96]">
              Talep detayı
            </p>
            <h2
              id="mentor-request-review-title"
              className="mt-1 text-[28px] font-semibold leading-tight text-[#22262b]"
            >
              {mentorWorkspaceName(request)}
            </h2>
            {person ? (
              <p className="mt-1 text-sm text-[#676e78]">{person}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="grid size-6 place-items-center text-[#676e78] hover:text-[#22262b]"
          >
            <X className="size-6" />
          </button>
        </div>

        <div className="mt-5">
          <RequestDetailsPanel request={request} showPreferredSlots={false} />
        </div>

        <div className="mt-5">
          <h3 className="text-base font-medium text-[#22262b]">
            Mentee’nin tercih ettiği saatler
          </h3>
          {slots.length === 0 ? (
            <p className="mt-2 text-sm text-[#676e78]">
              Bu talepte tercih saati belirtilmemiş.
            </p>
          ) : (
            <div className="mt-3 grid gap-2">
              {slots.map((slot, index) => {
                const key = preferredSlotKey(slot) || slot.label;
                const selectedSlot = mode === "accept" && key === selectedKey;
                return (
                  <button
                    key={`${slot.label}-${index}`}
                    type="button"
                    aria-pressed={selectedSlot}
                    disabled={mode !== "accept"}
                    onClick={() => {
                      setMode("accept");
                      setSelectedKey(key);
                    }}
                    className={`min-h-11 rounded-lg border px-4 text-left text-sm font-medium ${
                      selectedSlot
                        ? "border-[#e86f22] bg-[#fdebdd] text-[#e86f22]"
                        : "border-[#e4e7ea] bg-white text-[#22262b] hover:border-[#f2b78f] disabled:opacity-50"
                    }`}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-5 rounded-[10px] border border-[#e4e7ea] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-base font-medium text-[#22262b]">
                Saatleri beğenmediysen kendi gün ve saatini öner
              </h3>
              <p className="mt-1 text-xs text-[#858c96]">
                En az bir öneri yeterli. Daha fazla ekleyebilirsin. Saatler tam
                (10:00) veya buçuk (10:30) olmalı.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMode(mode === "propose" ? "accept" : "propose")}
              className="shrink-0 text-[13px] font-medium text-[#e86f22]"
            >
              {mode === "propose"
                ? "Mentee saatlerine dön"
                : "Kendi saatimi öner"}
            </button>
          </div>

          {mode === "propose" ? (
            <div className="mt-4 grid gap-2">
              {proposedSlots.map((slot, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-center gap-2 text-xs text-[#676e78]"
                >
                  <span className="w-16">{index + 1}. öneri</span>
                  <select
                    value={slot.date}
                    aria-label={`${index + 1}. öneri günü`}
                    onChange={(event) =>
                      updateProposedSlot(index, { date: event.target.value })
                    }
                    className="min-h-9 min-w-[132px] flex-1 rounded-lg border border-[#d4d8dd] px-2.5 text-sm text-[#22262b] outline-none"
                  >
                    <option value="">Gün seç</option>
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
                    aria-label={`${index + 1}. öneri saati`}
                    onChange={(event) =>
                      updateProposedSlot(index, { time: event.target.value })
                    }
                    className={`min-h-9 min-w-[110px] flex-1 rounded-lg border px-2.5 text-sm text-[#22262b] outline-none ${
                      slot.time && !isHalfOrFullHour(slot.time)
                        ? "border-red-400"
                        : "border-[#d4d8dd]"
                    }`}
                  />
                </div>
              ))}
              {proposedSlots.length < MAX_PROPOSED_SLOT_COUNT ? (
                <button
                  type="button"
                  onClick={() =>
                    setProposedSlots((current) => [
                      ...current,
                      emptyPreferredSlot(),
                    ])
                  }
                  className="mt-1 text-left text-[13px] font-medium text-[#e86f22]"
                >
                  + Bir tane daha ekle
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {mode === "accept" ? (
          <>
            <label className="mt-5 block">
              <span className="text-base font-medium text-[#22262b]">
                Meet linki
              </span>
              <input
                type="text"
                value={meetLink}
                onChange={(event) => setMeetLink(event.target.value)}
                placeholder="https://meet.google.com/..."
                className="mt-2 min-h-11 w-full rounded-lg border border-[#d4d8dd] px-3.5 text-sm text-[#22262b] outline-none"
              />
            </label>

            <TranscribeRequestedField
              checked={transcribeRequested}
              onChange={setTranscribeRequested}
            />
          </>
        ) : null}

        <DocumentRequestTitleEditor
          titles={documentTitles}
          onChange={setDocumentTitles}
          disabled={isPending}
        />

        {error ? (
          <p role="alert" className="mt-4 text-xs text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>Vazgeç</SecondaryButton>
          {mode === "propose" ? (
            <PrimaryButton
              disabled={isPending || !canPropose}
              onClick={() =>
                onPropose(
                  proposedSlots.filter(isValidPreferredSlot),
                  documentTitles,
                )
              }
            >
              {isPending ? "Gönderiliyor…" : "Önerileri gönder"}
            </PrimaryButton>
          ) : (
            <PrimaryButton
              disabled={isPending || !canAccept}
              onClick={() =>
                onAccept(
                  selected ?? null,
                  meetLink,
                  transcribeRequested,
                  documentTitles,
                )
              }
            >
              {isPending ? "Kabul ediliyor…" : "Kabul et"}
            </PrimaryButton>
          )}
        </div>
      </div>
    </div>
  );
}
