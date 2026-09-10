"use client";

import { ChevronDown, X } from "lucide-react";
import { useMemo, useState } from "react";

import { TranscribeRequestedField } from "@/components/meetings/transcribe-requested-field";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import type { Program } from "@/interfaces/program";
import { timeLabel, upcomingHourColumns } from "@/lib/calendar";
import {
  CALENDAR_MEETING_DURATION_MINUTES,
  CREATE_MEETING_NO_STARTUP_MESSAGE,
} from "@/lib/const";
import { parseGoogleMeetLink } from "@/lib/google-calendar";
import {
  groupMeetingTargets,
  meetingRecipient,
  meetingTargetLabel,
  type MeetingTarget,
} from "@/lib/meeting-targets";

function StartupCard({
  target,
  selected,
  onSelect,
}: {
  target: MeetingTarget;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={`flex cursor-pointer flex-col rounded-xl border px-3 py-2 transition ${
        selected
          ? "border-[#e86f22] bg-[#fdebdd]"
          : "border-[#c7dcf3] bg-white hover:border-[#8fbdea]"
      }`}
    >
      <input
        type="checkbox"
        name="meeting-startup"
        value={target.key}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        className={`truncate text-[13px] font-semibold ${
          selected ? "text-[#22262b]" : "text-[#5f7c9a]"
        }`}
      >
        {meetingTargetLabel(target)}
      </span>
      <span className="mt-0.5 truncate text-[11px] text-[#8aa2b8]">
        {target.subtitle}
      </span>
    </label>
  );
}

export type CreateMeetingRecipient = {
  mentorshipRequestId?: string;
  programId?: string;
  organizationId?: string;
};

export type CreateMeetingInput = CreateMeetingRecipient & {
  scheduledAt: string;
  durationMinutes: number;
  agenda: string;
  meetLink?: string;
  transcribeRequested?: boolean;
};

export type CreateMeetingBatch = {
  scheduledAt: string;
  durationMinutes: number;
  agenda: string;
  meetLink?: string;
  transcribeRequested?: boolean;
  recipients: CreateMeetingRecipient[];
};

export function CreateMeetingDialog({
  mentorName,
  mentorships,
  programs,
  onClose,
  onSubmit,
  isSaving,
  error,
  startAt,
}: {
  mentorName: string;
  mentorships: MentorshipRequest[];
  programs: Program[];
  onClose: () => void;
  onSubmit: (input: CreateMeetingBatch) => Promise<void>;
  isSaving: boolean;
  error?: Error | null;
  startAt: Date | null;
}) {
  const grouped = useMemo(
    () => groupMeetingTargets(mentorships, programs),
    [mentorships, programs],
  );
  const allTargets = useMemo(
    () => [
      ...grouped.ungrouped,
      ...grouped.byProgram.flatMap((group) => group.items),
    ],
    [grouped],
  );
  const hasTargets = allTargets.length > 0;
  const defaultKeys =
    grouped.ungrouped[0]?.key != null
      ? [grouped.ungrouped[0].key]
      : (grouped.byProgram[0]?.items.map((item) => item.key) ?? []);

  const [selectedKeys, setSelectedKeys] = useState<string[]>(defaultKeys);
  const [slotIso, setSlotIso] = useState("");
  const [openProgramId, setOpenProgramId] = useState(
    grouped.byProgram[0]?.program.id ?? "",
  );
  const [agenda, setAgenda] = useState(`Mentor: ${mentorName}`);
  const [manualMeetLink, setManualMeetLink] = useState("");
  const [linkError, setLinkError] = useState("");
  const [transcribeRequested, setTranscribeRequested] = useState(false);

  const columns = useMemo(() => upcomingHourColumns(), []);
  const scheduledAt = startAt ?? (slotIso ? new Date(slotIso) : null);
  const recipients = allTargets.filter((target) =>
    selectedKeys.includes(target.key),
  );
  const canSubmit = recipients.length > 0 && Boolean(scheduledAt) && !isSaving;

  function toggleStartup(key: string) {
    setSelectedKeys((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );
  }

  function toggleProgram(keys: string[]) {
    setSelectedKeys((current) => {
      const allOn = keys.every((key) => current.includes(key));
      if (allOn) return current.filter((key) => !keys.includes(key));
      return [...new Set([...current, ...keys])];
    });
  }

  function submitBatch(meetLink?: string) {
    if (!scheduledAt) return;
    void onSubmit({
      scheduledAt: scheduledAt.toISOString(),
      durationMinutes: CALENDAR_MEETING_DURATION_MINUTES,
      agenda,
      meetLink,
      transcribeRequested,
      recipients: recipients.map(meetingRecipient),
    });
  }

  function handleSubmit() {
    if (!scheduledAt || recipients.length === 0) return;
    const pasted = manualMeetLink.trim();
    if (pasted) {
      const parsed = parseGoogleMeetLink(pasted);
      if (!parsed) {
        setLinkError("Geçerli bir Google Meet linki yapıştırın.");
        return;
      }
      setLinkError("");
      submitBatch(parsed);
      return;
    }
    setLinkError("");
    submitBatch();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Yeni toplantı oluştur"
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
    >
      <div className="max-h-[94vh] w-full max-w-[720px] overflow-y-auto rounded-2xl bg-white p-6 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-bold text-[#22262b]">Start up seç</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="-mr-1 -mt-1 grid size-7 shrink-0 place-items-center rounded-full text-[#858c96] hover:bg-[#f1f2f4]"
          >
            <X className="size-4" />
          </button>
        </div>

        {!hasTargets ? (
          <p className="mt-4 text-sm text-[#676e78]">
            {CREATE_MEETING_NO_STARTUP_MESSAGE}
          </p>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {grouped.ungrouped.map((target) => (
                <StartupCard
                  key={target.key}
                  target={target}
                  selected={selectedKeys.includes(target.key)}
                  onSelect={() => toggleStartup(target.key)}
                />
              ))}
            </div>

            {grouped.byProgram.length > 0 ? (
              <div className="mt-4">
                {grouped.byProgram.map((group) => {
                  const keys = group.items.map((item) => item.key);
                  const open = openProgramId === group.program.id;
                  const selected =
                    keys.length > 0 &&
                    keys.every((key) => selectedKeys.includes(key));
                  return (
                    <div
                      key={group.program.id}
                      className="border-b border-[#e4e7ea]"
                    >
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-pressed={selected}
                          onClick={() => {
                            toggleProgram(keys);
                            setOpenProgramId(group.program.id);
                          }}
                          className={`min-w-0 flex-1 py-2.5 text-left text-sm font-semibold ${
                            selected ? "text-[#e86f22]" : "text-[#22262b]"
                          }`}
                        >
                          {group.program.name}
                        </button>
                        <button
                          type="button"
                          aria-expanded={open}
                          aria-label={`${group.program.name} üyelerini göster`}
                          onClick={() =>
                            setOpenProgramId(open ? "" : group.program.id)
                          }
                          className="grid size-8 shrink-0 place-items-center text-[#858c96]"
                        >
                          <ChevronDown
                            className={`size-4 transition ${open ? "rotate-180" : ""}`}
                          />
                        </button>
                      </div>
                      {open ? (
                        <div className="grid grid-cols-3 gap-2 pb-3">
                          {group.items.map((target) => (
                            <StartupCard
                              key={target.key}
                              target={target}
                              selected={selectedKeys.includes(target.key)}
                              onSelect={() => toggleStartup(target.key)}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}

            {startAt ? null : (
              <>
                <h3 className="mt-5 text-base font-bold text-[#22262b]">
                  Tarih Seç
                </h3>
                <div className="mt-2 rounded-xl border border-[#e4e7ea] p-3">
                  <p className="text-[11px] text-[#858c96]">Önümüzdeki 7 gün</p>
                  <div className="mt-2 grid grid-cols-5 gap-1.5">
                    {columns.map((column) => (
                      <div key={column.key} className="min-w-0">
                        <p className="truncate text-center text-[11px] text-[#676e78]">
                          {column.heading}
                        </p>
                        <div className="mt-1.5 space-y-1.5">
                          {column.slots.map((slot) => {
                            const iso = slot.toISOString();
                            const picked = slotIso === iso;
                            return (
                              <button
                                key={iso}
                                type="button"
                                onClick={() => setSlotIso(iso)}
                                aria-pressed={picked}
                                className={`w-full rounded-md border py-1 text-[11px] font-medium transition ${
                                  picked
                                    ? "border-[#e86f22] bg-[#e86f22] text-white"
                                    : "border-[#c7dcf3] bg-white text-[#2f7ff0] hover:border-[#8fbdea]"
                                }`}
                              >
                                {timeLabel(iso)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[#858c96]">
                    <span className="size-1.5 rounded-full bg-[#e86f22]" />
                    Seçilebilir saat
                  </p>
                </div>
              </>
            )}

            <div className="mt-4 rounded-xl border border-[#e4e7ea] p-3">
              <label className="block text-sm font-semibold text-[#22262b]">
                İstek Özeti
                <textarea
                  value={agenda}
                  onChange={(event) => setAgenda(event.target.value)}
                  rows={3}
                  className="mt-2 w-full resize-y rounded-lg border border-[#e4e7ea] px-2 py-1.5 text-sm font-normal text-[#22262b] outline-none focus:border-[#e86f22]"
                />
              </label>
            </div>

            {error ? (
              <div className="mt-3 space-y-2">
                <p
                  role="alert"
                  className="rounded-lg bg-[#fdeaea] px-3 py-2 text-xs text-[#b42318]"
                >
                  Otomatik Google Meet oluşturulamadı. {error.message} Linki
                  kendin oluşturup aşağıya yapıştırabilirsin.
                </p>
                <label className="block text-sm font-semibold text-[#22262b]">
                  Google Meet linki
                  <input
                    type="url"
                    value={manualMeetLink}
                    onChange={(event) => {
                      setManualMeetLink(event.target.value);
                      setLinkError("");
                    }}
                    placeholder="https://meet.google.com/xxx-yyyy-zzz"
                    className="mt-1 w-full rounded-lg border border-[#e4e7ea] px-2 py-1.5 text-sm font-normal text-[#22262b] outline-none focus:border-[#e86f22]"
                  />
                </label>
                {linkError ? (
                  <p className="text-xs text-[#b42318]">{linkError}</p>
                ) : null}
              </div>
            ) : null}

            <TranscribeRequestedField
              checked={transcribeRequested}
              onChange={setTranscribeRequested}
            />

            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="mt-4 w-full rounded-xl bg-[#e86f22] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#ce5e19] disabled:opacity-60"
            >
              {isSaving ? "Gönderiliyor..." : "Gönder"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
