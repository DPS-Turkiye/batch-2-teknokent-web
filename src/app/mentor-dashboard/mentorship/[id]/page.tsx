"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import { Avatar } from "@/components/common/avatar";
import { Badge } from "@/components/common/badge";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { useSession } from "@/components/providers/session-provider";
import { useMentorshipRequest } from "@/hooks/use-mentorship-requests";
import {
  useLogMeeting,
  useMentorshipMeetings,
  useUpdateMeeting,
} from "@/hooks/use-mentorship-timeline";
import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { AppArea } from "@/types/app-area";

const statusLabels: Record<MentorshipRequestStatus, string> = {
  [MentorshipRequestStatus.Accepted]: "Kabul Edildi",
  [MentorshipRequestStatus.Declined]: "Uygun Değil",
  [MentorshipRequestStatus.MoreInfoRequested]: "Ek Bilgi İstendi",
  [MentorshipRequestStatus.Pending]: "Yanıt Bekliyor",
  [MentorshipRequestStatus.Withdrawn]: "Geri Çekildi",
};

const statusTones: Record<
  MentorshipRequestStatus,
  "gray" | "green" | "amber" | "purple"
> = {
  [MentorshipRequestStatus.Accepted]: "green",
  [MentorshipRequestStatus.Declined]: "gray",
  [MentorshipRequestStatus.MoreInfoRequested]: "purple",
  [MentorshipRequestStatus.Pending]: "amber",
  [MentorshipRequestStatus.Withdrawn]: "gray",
};

const meetingStatusLabels: Record<MeetingStatus, string> = {
  [MeetingStatus.Scheduled]: "Planlandı",
  [MeetingStatus.Completed]: "Tamamlandı",
  [MeetingStatus.Cancelled]: "İptal Edildi",
  [MeetingStatus.GoogleCalendar]: "Google Takvim",
};

const meetingStatusTones: Record<
  MeetingStatus,
  "gray" | "green" | "amber" | "purple"
> = {
  [MeetingStatus.Scheduled]: "amber",
  [MeetingStatus.Completed]: "green",
  [MeetingStatus.Cancelled]: "gray",
  [MeetingStatus.GoogleCalendar]: "purple",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

function toDateTimeLocalValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function MeetingNoteEditor({
  meeting,
  onSave,
  isSaving,
}: {
  meeting: MeetingItem;
  onSave: (payload: {
    notes?: string;
    outcomes?: string;
    status?: MeetingStatus;
  }) => void;
  isSaving: boolean;
}) {
  const [notes, setNotes] = useState(meeting.notes ?? "");
  const [outcomes, setOutcomes] = useState(meeting.outcomes ?? "");
  const [status, setStatus] = useState<MeetingStatus>(
    (meeting.status as MeetingStatus) ?? MeetingStatus.Scheduled,
  );

  return (
    <div className="mt-3 space-y-2 border-t border-zinc-100 pt-3">
      <label className="block text-xs font-semibold text-zinc-700">
        Notlar
      </label>
      <textarea
        rows={2}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        className="w-full rounded-lg border border-zinc-300 p-2 text-xs focus:border-zinc-900 focus:outline-none"
        placeholder="Görüşme notları..."
      />
      <label className="block text-xs font-semibold text-zinc-700">
        Sonuçlar
      </label>
      <textarea
        rows={2}
        value={outcomes}
        onChange={(event) => setOutcomes(event.target.value)}
        className="w-full rounded-lg border border-zinc-300 p-2 text-xs focus:border-zinc-900 focus:outline-none"
        placeholder="Görüşme sonuçları..."
      />
      <div className="flex items-center justify-between gap-2">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as MeetingStatus)}
          className="rounded-lg border border-zinc-300 p-2 text-xs focus:border-zinc-900 focus:outline-none"
        >
          {Object.values(MeetingStatus)
            .filter((value) => value !== MeetingStatus.GoogleCalendar)
            .map((value) => (
              <option key={value} value={value}>
                {meetingStatusLabels[value]}
              </option>
            ))}
        </select>
        <PrimaryButton
          disabled={isSaving}
          onClick={() => onSave({ notes, outcomes, status })}
        >
          {isSaving ? "Kaydediliyor..." : "Kaydet"}
        </PrimaryButton>
      </div>
    </div>
  );
}

export default function MentorshipTimelinePage() {
  const params = useParams<{ id: string }>();
  const requestId = params.id;
  const { session } = useSession();
  const requestQuery = useMentorshipRequest(requestId);
  const meetingsQuery = useMentorshipMeetings(requestId);
  const logMeetingMutation = useLogMeeting(requestId);
  const updateMeetingMutation = useUpdateMeeting(requestId);

  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [logError, setLogError] = useState("");
  const now = new Date();
  const [form, setForm] = useState({
    scheduledAt: toDateTimeLocalValue(now),
    durationMinutes: 60,
    agenda: "",
    notes: "",
    status: MeetingStatus.Completed,
  });

  const request = requestQuery.data;
  const meetings = meetingsQuery.data ?? [];

  const handleLogMeeting = async () => {
    if (!session) return;
    setLogError("");
    try {
      await logMeetingMutation.mutateAsync({
        mentorId: session.userId,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        durationMinutes: form.durationMinutes,
        agenda: form.agenda || undefined,
        notes: form.notes || undefined,
        status: form.status,
      });
      setForm((previous) => ({ ...previous, agenda: "", notes: "" }));
    } catch (error) {
      setLogError(
        error instanceof Error ? error.message : "Görüşme kaydedilemedi.",
      );
    }
  };

  return (
    <AppShell
      active={AppArea.MentorDashboard}
      title="Mentorluk Süreci"
      backHref="/mentor-dashboard"
    >
      <div className="mx-auto w-full max-w-[900px] space-y-6 px-4 pb-12 pt-8 sm:px-8">
        {requestQuery.isLoading ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
            Yükleniyor...
          </div>
        ) : !request ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
            Talep bulunamadı.
          </div>
        ) : (
          <>
            <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center">
              <Avatar
                initials={
                  request.organizationName?.substring(0, 2).toUpperCase() ??
                  "GR"
                }
              />
              <div className="flex-1">
                <h2 className="text-base font-bold text-zinc-900">
                  {request.organizationName ?? "Girişim"}
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {request.supportArea}
                </p>
              </div>
              <Badge tone={statusTones[request.status]}>
                {statusLabels[request.status]}
              </Badge>
            </section>

            <section className="rounded-xl border border-zinc-200 bg-white p-5">
              <h3 className="text-sm font-bold text-zinc-900">
                Görüşme Geçmişi
              </h3>
              {meetingsQuery.isLoading ? (
                <p className="mt-3 text-xs text-zinc-500">Yükleniyor...</p>
              ) : meetings.length === 0 ? (
                <p className="mt-3 text-xs text-zinc-500">
                  Henüz kaydedilmiş bir görüşme yok.
                </p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {meetings.map((meeting) => (
                    <li
                      key={meeting.id}
                      className="rounded-lg border border-zinc-200 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">
                            {formatDateTime(meeting.scheduledAt)}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {meeting.durationMinutes} dk
                            {meeting.agenda ? ` · ${meeting.agenda}` : ""}
                          </p>
                        </div>
                        <Badge
                          tone={
                            meetingStatusTones[
                              (meeting.status as MeetingStatus) ??
                                MeetingStatus.Scheduled
                            ]
                          }
                        >
                          {
                            meetingStatusLabels[
                              (meeting.status as MeetingStatus) ??
                                MeetingStatus.Scheduled
                            ]
                          }
                        </Badge>
                      </div>

                      {meeting.notes || meeting.outcomes ? (
                        <div className="mt-3 space-y-1 text-xs text-zinc-600">
                          {meeting.notes ? (
                            <p>
                              <span className="font-semibold text-zinc-700">
                                Notlar:
                              </span>{" "}
                              {meeting.notes}
                            </p>
                          ) : null}
                          {meeting.outcomes ? (
                            <p>
                              <span className="font-semibold text-zinc-700">
                                Sonuçlar:
                              </span>{" "}
                              {meeting.outcomes}
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      {editingMeetingId === meeting.id ? (
                        <MeetingNoteEditor
                          meeting={meeting}
                          isSaving={updateMeetingMutation.isPending}
                          onSave={(payload) => {
                            updateMeetingMutation.mutate(
                              { id: meeting.id, payload },
                              { onSuccess: () => setEditingMeetingId(null) },
                            );
                          }}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingMeetingId(meeting.id)}
                          className="mt-3 text-xs font-semibold text-zinc-700 underline"
                        >
                          Not / durum düzenle
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-zinc-200 bg-white p-5">
              <h3 className="text-sm font-bold text-zinc-900">
                Yeni Görüşme Kaydet
              </h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700">
                    Tarih ve Saat
                  </label>
                  <input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        scheduledAt: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-300 p-2 text-xs focus:border-zinc-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700">
                    Süre (dk)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.durationMinutes}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        durationMinutes: Number(event.target.value),
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-300 p-2 text-xs focus:border-zinc-900 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700">
                    Gündem
                  </label>
                  <input
                    type="text"
                    value={form.agenda}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        agenda: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-300 p-2 text-xs focus:border-zinc-900 focus:outline-none"
                    placeholder="Görüşme konusu..."
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700">
                    Notlar
                  </label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        notes: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-300 p-2 text-xs focus:border-zinc-900 focus:outline-none"
                    placeholder="Görüşme notları..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700">
                    Durum
                  </label>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        status: event.target.value as MeetingStatus,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-300 p-2 text-xs focus:border-zinc-900 focus:outline-none"
                  >
                    {Object.values(MeetingStatus)
                      .filter((value) => value !== MeetingStatus.GoogleCalendar)
                      .map((value) => (
                        <option key={value} value={value}>
                          {meetingStatusLabels[value]}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              {logError ? (
                <p role="alert" className="mt-3 text-xs text-red-700">
                  {logError}
                </p>
              ) : null}
              <div className="mt-4 flex justify-end gap-3">
                <SecondaryButton
                  onClick={() =>
                    setForm({
                      scheduledAt: toDateTimeLocalValue(new Date()),
                      durationMinutes: 60,
                      agenda: "",
                      notes: "",
                      status: MeetingStatus.Completed,
                    })
                  }
                >
                  Temizle
                </SecondaryButton>
                <PrimaryButton
                  disabled={logMeetingMutation.isPending}
                  onClick={() => void handleLogMeeting()}
                >
                  {logMeetingMutation.isPending
                    ? "Kaydediliyor..."
                    : "Görüşmeyi Kaydet"}
                </PrimaryButton>
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
