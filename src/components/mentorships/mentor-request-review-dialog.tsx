"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import {
  parsePreferredSlotsFromMessage,
  preferredSlotKey,
  requestOutcomeFromMessage,
  type ParsedPreferredSlot,
} from "@/lib/mentor-availability-days";
import {
  formatRequestSentAt,
  mentorWorkspaceName,
  mentorWorkspacePerson,
} from "@/lib/mentorship-workspace";

export function MentorRequestReviewDialog({
  request,
  isPending,
  error,
  onClose,
  onAccept,
}: {
  request: MentorshipRequest;
  isPending: boolean;
  error: string;
  onClose: () => void;
  onAccept: (slot: ParsedPreferredSlot | null, meetLink: string) => void;
}) {
  const slots = parsePreferredSlotsFromMessage(request.requesterMessage);
  const [selectedKey, setSelectedKey] = useState("");
  const [meetLink, setMeetLink] = useState("");
  const selected = slots.find(
    (slot) => (preferredSlotKey(slot) || slot.label) === selectedKey,
  );
  const outcome = requestOutcomeFromMessage(request.requesterMessage);
  const person = mentorWorkspacePerson(request);
  const canAccept = slots.length === 0 || Boolean(selected);

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

        <div className="mt-5 space-y-3 text-sm text-[#676e78]">
          <p className="rounded-[10px] border border-[#e4e7ea] px-3.5 py-3">
            Konu: {request.supportArea}
          </p>
          <p className="rounded-[10px] border border-[#e4e7ea] px-3.5 py-3">
            Talep gönderildi: {formatRequestSentAt(request.createdAt)}
          </p>
          {request.summary ? (
            <p className="rounded-[20px] border border-[#e86f22] px-6 py-6 text-[#22262b]">
              “{request.summary}”
            </p>
          ) : null}
          {outcome ? (
            <p className="rounded-[10px] border border-[#e4e7ea] px-3.5 py-3">
              Beklenen çıktı: {outcome}
            </p>
          ) : null}
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
                const selectedSlot = key === selectedKey;
                return (
                  <button
                    key={`${slot.label}-${index}`}
                    type="button"
                    aria-pressed={selectedSlot}
                    onClick={() => setSelectedKey(key)}
                    className={`min-h-11 rounded-lg border px-4 text-left text-sm font-medium ${
                      selectedSlot
                        ? "border-[#e86f22] bg-[#fdebdd] text-[#e86f22]"
                        : "border-[#e4e7ea] bg-white text-[#22262b] hover:border-[#f2b78f]"
                    }`}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

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

        {error ? (
          <p role="alert" className="mt-4 text-xs text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>Vazgeç</SecondaryButton>
          <PrimaryButton
            disabled={isPending || !canAccept}
            onClick={() => onAccept(selected ?? null, meetLink)}
          >
            {isPending ? "Kabul ediliyor…" : "Kabul et"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
