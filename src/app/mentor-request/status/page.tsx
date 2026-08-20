"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Avatar } from "@/components/common/avatar";
import { Badge } from "@/components/common/badge";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { AppShell } from "@/components/hoc/app-shell";
import {
  useAlternativeMentors,
  useMentorAvailability,
  useMentorshipRequest,
  useMentorshipRequests,
  useReplyToMentorRequest,
  useScheduleMeeting,
  useWithdrawMentorRequest,
} from "@/hooks/use-mentorship-requests";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";

const statusLabels: Record<MentorshipRequestStatus, string> = {
  [MentorshipRequestStatus.Accepted]: "Kabul Edildi",
  [MentorshipRequestStatus.Declined]: "Uygun Değil",
  [MentorshipRequestStatus.MoreInfoRequested]: "Ek Bilgi İstendi",
  [MentorshipRequestStatus.Pending]: "Yanıt Bekleniyor",
  [MentorshipRequestStatus.Withdrawn]: "Geri Çekildi",
};

const statusTones: Record<
  MentorshipRequestStatus,
  "amber" | "gray" | "green" | "purple"
> = {
  [MentorshipRequestStatus.Accepted]: "green",
  [MentorshipRequestStatus.Declined]: "gray",
  [MentorshipRequestStatus.MoreInfoRequested]: "purple",
  [MentorshipRequestStatus.Pending]: "amber",
  [MentorshipRequestStatus.Withdrawn]: "gray",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function RequestStatusPage() {
  const router = useRouter();
  const params = useSearchParams();
  const requestsQuery = useMentorshipRequests("mentee");
  const requestedStatus = params.get("state") as MentorshipRequestStatus | null;
  const explicitId = params.get("request") ?? params.get("id");
  const selectedId =
    explicitId ??
    requestsQuery.data?.find((request) => request.status === requestedStatus)
      ?.id ??
    requestsQuery.data?.[0]?.id ??
    null;
  const requestQuery = useMentorshipRequest(selectedId);
  const request = requestQuery.data;
  const replyMutation = useReplyToMentorRequest(selectedId);
  const withdrawMutation = useWithdrawMentorRequest(selectedId);
  const availabilityQuery = useMentorAvailability(
    selectedId,
    request?.status === MentorshipRequestStatus.Accepted,
  );
  const alternativesQuery = useAlternativeMentors(
    selectedId,
    request?.status === MentorshipRequestStatus.Declined,
  );
  const scheduleMutation = useScheduleMeeting(selectedId);
  const [reply, setReply] = useState("");
  const [scheduledSlotId, setScheduledSlotId] = useState<string | null>(null);

  async function bookSlot(slotId: string) {
    const meeting = await scheduleMutation.mutateAsync(slotId);
    if (meeting) setScheduledSlotId(slotId);
  }

  async function sendReply() {
    if (!reply.trim()) return;
    await replyMutation.mutateAsync(reply.trim());
    setReply("");
  }

  return (
    <AppShell title="Talep Detayı" backHref="/dashboard">
      <div className="mx-auto max-w-[736px] px-4 py-6 sm:px-8">
        <div className="flex gap-2 overflow-x-auto">
          {Object.values(MentorshipRequestStatus)
            .filter((status) => status !== MentorshipRequestStatus.Withdrawn)
            .map((status) => (
              <button
                type="button"
                key={status}
                aria-pressed={request?.status === status}
                onClick={() =>
                  router.push(`/mentor-request/status?state=${status}`)
                }
                className={`shrink-0 rounded-full border px-3 py-2 text-xs ${request?.status === status ? "border-[#555] bg-[#555] font-medium text-white" : "border-[#e5e7eb] bg-white text-[#555]"}`}
              >
                {statusLabels[status]}
              </button>
            ))}
        </div>

        {requestsQuery.error || requestQuery.error ? (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {requestsQuery.error?.message ?? requestQuery.error?.message}
          </p>
        ) : null}
        {!request && !requestQuery.error ? (
          <p className="mt-4 text-sm text-[#777]">Talep yükleniyor…</p>
        ) : null}

        {request ? (
          <>
            <section className="mt-4 rounded-lg border border-[#e5e7eb] bg-white p-4">
              <div className="flex items-center gap-3">
                <Avatar initials={initials(request.mentorName) || "MN"} />
                <div className="flex-1">
                  <h2 className="text-sm font-semibold">
                    {request.mentorName}
                  </h2>
                  <p className="mt-1 text-xs text-[#777]">
                    {request.supportArea} · Gönderildi:{" "}
                    {new Intl.DateTimeFormat("tr-TR", {
                      dateStyle: "long",
                    }).format(new Date(request.createdAt))}
                  </p>
                </div>
                <Badge tone={statusTones[request.status]}>
                  {statusLabels[request.status]}
                </Badge>
              </div>
            </section>

            <section className="mt-3 rounded-lg border border-[#e5e7eb] bg-white p-4">
              {request.status === MentorshipRequestStatus.Pending ? (
                <div>
                  <h3 className="text-lg font-semibold">Yanıt bekleniyor</h3>
                  <p className="mt-2 text-sm text-[#777]">
                    Mentor talebinizi henüz yanıtlamadı.
                  </p>
                </div>
              ) : null}

              {request.status === MentorshipRequestStatus.MoreInfoRequested ? (
                <div>
                  <Badge tone="amber">Ek bilgi istendi</Badge>
                  <p className="mt-4 text-sm font-semibold">Mentorun sorusu:</p>
                  <blockquote className="mt-2 rounded-md bg-[#f9fafb] p-4 text-sm italic leading-6 text-[#555]">
                    {request.messages.find(
                      (message) => message.messageType === "MENTOR_QUESTION",
                    )?.body ??
                      request.mentorMessage ??
                      "Ek bilgi talep edildi."}
                  </blockquote>
                  <textarea
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    placeholder="Yanıtınızı yazın…"
                    className="mt-4 min-h-28 w-full rounded-md border border-[#e5e7eb] p-3 text-sm"
                  />
                  <div className="mt-3 flex justify-end">
                    <PrimaryButton
                      disabled={!reply.trim() || replyMutation.isPending}
                      onClick={() => void sendReply()}
                    >
                      {replyMutation.isPending
                        ? "Gönderiliyor…"
                        : "Yanıtı Gönder"}
                    </PrimaryButton>
                  </div>
                </div>
              ) : null}

              {request.status === MentorshipRequestStatus.Accepted ? (
                <div>
                  {scheduledSlotId ? (
                    <div>
                      <Badge tone="green">Toplantı planlandı</Badge>
                      <p className="mt-3 text-sm text-[#555]">
                        Seçtiğiniz zaman dilimi için toplantınız oluşturuldu.
                      </p>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold">
                        Toplantı zamanı seçin
                      </h3>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {availabilityQuery.data?.map((slot) => (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={scheduleMutation.isPending}
                            onClick={() => void bookSlot(slot.id)}
                            className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-3 text-left text-xs hover:border-[#555] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {new Intl.DateTimeFormat("tr-TR", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(slot.startsAt))}{" "}
                            · {slot.durationMinutes} dk
                          </button>
                        ))}
                      </div>
                      {!availabilityQuery.isLoading &&
                      !availabilityQuery.data?.length ? (
                        <p className="mt-3 text-sm text-[#777]">
                          Mentor henüz müsaitlik zamanı paylaşmadı.
                        </p>
                      ) : null}
                      {scheduleMutation.error ? (
                        <p role="alert" className="mt-3 text-sm text-red-700">
                          {scheduleMutation.error.message}
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
              ) : null}

              {request.status === MentorshipRequestStatus.Declined ? (
                <div>
                  <h3 className="text-lg font-semibold">Uygun değil</h3>
                  <p className="mt-3 text-sm text-[#777]">Neden uygun değil:</p>
                  <p className="mt-1 text-sm">
                    {request.rejectionReason ?? "Gerekçe belirtilmedi."}
                  </p>
                  <div className="mt-5 space-y-3">
                    {alternativesQuery.data?.map((mentor) => (
                      <div
                        key={mentor.id}
                        className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] p-4"
                      >
                        <Avatar initials={mentor.initials} />
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold">
                            {mentor.fullName}
                          </h4>
                          <p className="mt-1 text-xs text-[#777]">
                            {mentor.professionalTitle} · {mentor.company}
                          </p>
                        </div>
                        <PrimaryButton
                          href={`/mentor-request?step=4&exclude=${encodeURIComponent(request.mentorName)}&mentor=${encodeURIComponent(mentor.id)}`}
                        >
                          Bu Mentoru Seç
                        </PrimaryButton>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>

            {request.status === MentorshipRequestStatus.Pending ? (
              <div className="mt-5 flex flex-wrap gap-2">
                <SecondaryButton
                  disabled={withdrawMutation.isPending}
                  onClick={() => void withdrawMutation.mutateAsync()}
                >
                  {withdrawMutation.isPending
                    ? "Geri çekiliyor…"
                    : "Talebi Geri Çek"}
                </SecondaryButton>
                <SecondaryButton href="/mentors/compare">
                  Alternatif Mentorları Görüntüle
                </SecondaryButton>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
