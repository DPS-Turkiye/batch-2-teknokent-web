"use client";

import { useState } from "react";

import type { MentorshipRequest } from "@/interfaces/mentorship-request";

function toLocalInput(at: Date) {
  const offset = at.getTimezoneOffset();
  return new Date(at.getTime() - offset * 60000).toISOString().slice(0, 16);
}

export function CreateMeetingDialog({
  mentorName,
  mentorships,
  onClose,
  onSubmit,
  isSaving,
  error,
  startAt,
}: {
  mentorName: string;
  mentorships: MentorshipRequest[];
  onClose: () => void;
  onSubmit: (input: {
    mentorshipRequestId: string;
    scheduledAt: string;
    durationMinutes: number;
    agenda: string;
  }) => Promise<void>;
  isSaving: boolean;
  error?: Error | null;
  startAt: Date | null;
}) {
  const [requestId, setRequestId] = useState(mentorships[0]?.id ?? "");
  const [scheduledAt, setScheduledAt] = useState(() =>
    toLocalInput(startAt ?? new Date()),
  );
  const [agenda, setAgenda] = useState(`Mentor: ${mentorName}`);

  // The dialog is mounted fresh each time it opens, so the initial state
  // above already reflects the slot that was clicked.

  const canSubmit = Boolean(requestId) && Boolean(scheduledAt) && !isSaving;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Yeni toplantı oluştur"
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
    >
      <div className="w-full max-w-[420px] rounded-2xl bg-white p-5 shadow-lg">
        <h2 className="text-base font-bold text-[#22262b]">
          Yeni Toplantı Oluştur
        </h2>

        {mentorships.length === 0 ? (
          <p className="mt-4 text-sm text-[#676e78]">
            Toplantı oluşturmak için önce bir mentorluk talebini kabul etmeniz
            gerekiyor.
          </p>
        ) : (
          <>
            <fieldset className="mt-4">
              <legend className="text-xs font-semibold text-[#676e78]">
                Start up seç
              </legend>
              <div className="mt-2 grid gap-2">
                {mentorships.map((mentorship) => (
                  <label
                    key={mentorship.id}
                    className={`flex cursor-pointer flex-col rounded-xl border px-3 py-2 text-left ${
                      requestId === mentorship.id
                        ? "border-[#e86f22] bg-[#fdebdd]"
                        : "border-[#e4e7ea] bg-white"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="mentorship"
                        value={mentorship.id}
                        checked={requestId === mentorship.id}
                        onChange={() => setRequestId(mentorship.id)}
                        className="accent-[#e86f22]"
                      />
                      <span className="text-sm font-semibold text-[#22262b]">
                        {mentorship.organizationName ?? mentorship.supportArea}
                      </span>
                    </span>
                    <span className="pl-6 text-xs text-[#676e78]">
                      {mentorship.supportArea}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="mt-4 block text-xs font-semibold text-[#676e78]">
              Tarih ve saat
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                className="mt-1 w-full rounded-lg border border-[#e4e7ea] px-2 py-1.5 text-sm"
              />
            </label>

            <label className="mt-4 block text-xs font-semibold text-[#676e78]">
              İstek Özeti
              <textarea
                value={agenda}
                onChange={(event) => setAgenda(event.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-[#e4e7ea] px-2 py-1.5 text-sm text-[#22262b]"
              />
            </label>

            {error ? (
              <p
                role="alert"
                className="mt-3 rounded-lg bg-[#fdeaea] px-3 py-2 text-xs text-[#b42318]"
              >
                {error.message}
              </p>
            ) : null}

            <button
              type="button"
              disabled={!canSubmit}
              onClick={() =>
                onSubmit({
                  mentorshipRequestId: requestId,
                  scheduledAt: new Date(scheduledAt).toISOString(),
                  durationMinutes: 60,
                  agenda,
                })
              }
              className="mt-5 w-full rounded-xl bg-[#e86f22] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#ce5e19] disabled:opacity-60"
            >
              {isSaving ? "Oluşturuluyor..." : "Toplantıyı oluştur"}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-xl border border-[#e4e7ea] px-4 py-2 text-sm font-medium text-[#676e78]"
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}
