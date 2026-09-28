"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, FileUp, Upload } from "lucide-react";

import { Avatar } from "@/components/common/avatar";
import { Badge } from "@/components/common/badge";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { AppShell } from "@/components/hoc/app-shell";
import { DocumentRequestChecklist } from "@/components/mentorships/document-request-checklist";
import { RequestDetailsPanel } from "@/components/mentorships/request-details-panel";
import { ConversationThread } from "@/components/mentorship/conversation-thread";
import { useSession } from "@/components/providers/session-provider";
import {
  useAcceptProposedSlot,
  useAlternativeMentors,
  useMentorAvailability,
  useMentorshipRequest,
  useMentorshipRequests,
  useReplyForm,
  useRequestFileUpload,
  useSlotBooking,
  useWithdrawMentorRequest,
} from "@/hooks/use-mentorship-requests";
import { MeetingStatus } from "@/interfaces/meeting";
import {
  MentorshipRequestMessageType,
  MentorshipRequestStatus,
} from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { logMentorshipMeeting } from "@/lib/client/mentor-requests";
import { MENTORSHIP_MEETING_DURATION_MINUTES } from "@/lib/const";
import { formatSlotDateTime } from "@/lib/format";
import {
  parseProposedSlotsFromMessage,
  preferredSlotKey,
  preferredSlotMachineValue,
  preferredSlotStartsAt,
} from "@/lib/mentor-availability-days";
import { mentorProfileHref } from "@/lib/mentor-profile-request";
import { initials } from "@/lib/utils";
import { AppArea } from "@/types/app-area";

const statusLabels: Record<MentorshipRequestStatus, string> = {
  [MentorshipRequestStatus.Accepted]: "Kabul Edildi",
  [MentorshipRequestStatus.CounterProposed]: "Saat Önerildi",
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
  [MentorshipRequestStatus.CounterProposed]: "amber",
  [MentorshipRequestStatus.Declined]: "gray",
  [MentorshipRequestStatus.MoreInfoRequested]: "purple",
  [MentorshipRequestStatus.Pending]: "amber",
  [MentorshipRequestStatus.Withdrawn]: "gray",
};

export default function RequestStatusPage() {
  return (
    <Suspense
      fallback={
        <AppShell
          active={AppArea.Mentorships}
          title="Talep Detayı"
          backHref="/mentorships?tab=requests"
        >
          <p className="mx-auto max-w-[960px] px-4 py-6 text-sm text-[#777] sm:px-8">
            Talep yükleniyor…
          </p>
        </AppShell>
      }
    >
      <RequestStatusContent />
    </Suspense>
  );
}

function RequestStatusContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { session } = useSession();
  const requestsQuery = useMentorshipRequests(UserRole.Mentee);
  const requestedStatus = params.get("state") as MentorshipRequestStatus | null;
  const explicitId = params.get("request") ?? params.get("id");
  // Only an explicit id, or the status this page was sent to find, picks a
  // request. Falling back to the first one opened a request nobody chose.
  const selectedId =
    explicitId ??
    (requestedStatus
      ? (requestsQuery.data?.find(
          (request) => request.status === requestedStatus,
        )?.id ?? null)
      : null);
  const requestQuery = useMentorshipRequest(selectedId);
  const request = requestQuery.data;
  const withdrawMutation = useWithdrawMentorRequest(selectedId);
  const availabilityQuery = useMentorAvailability(
    selectedId,
    request?.status === MentorshipRequestStatus.Accepted,
  );
  const alternativesQuery = useAlternativeMentors(
    selectedId,
    request?.status === MentorshipRequestStatus.Declined,
  );
  const {
    reply,
    setReply,
    sendReply,
    isSending,
    error: replyError,
  } = useReplyForm(selectedId);
  const {
    scheduledSlotId,
    bookSlot,
    isBooking,
    error: scheduleError,
  } = useSlotBooking(selectedId);
  const fileUpload = useRequestFileUpload(selectedId);
  const acceptProposalMutation = useAcceptProposedSlot(selectedId);
  const [selectedProposalKey, setSelectedProposalKey] = useState("");
  const [proposalError, setProposalError] = useState("");
  const proposedSlots = parseProposedSlotsFromMessage(request?.mentorMessage);
  const selectedProposal = proposedSlots.find(
    (slot) => (preferredSlotKey(slot) || slot.label) === selectedProposalKey,
  );

  async function acceptMentorProposal() {
    if (!request || !selectedProposal) return;
    setProposalError("");
    try {
      await acceptProposalMutation.mutateAsync(
        preferredSlotMachineValue(selectedProposal),
      );
      const startsAt = preferredSlotStartsAt(selectedProposal);
      if (startsAt) {
        try {
          await logMentorshipMeeting(request.id, {
            mentorId: request.mentorId,
            scheduledAt: startsAt,
            durationMinutes: MENTORSHIP_MEETING_DURATION_MINUTES,
            status: MeetingStatus.Scheduled,
          });
        } catch {}
      }
      router.push("/mentorships");
    } catch (caught) {
      setProposalError(
        caught instanceof Error
          ? caught.message
          : "Saat kabul edilemedi. Lütfen tekrar dene.",
      );
    }
  }

  return (
    <AppShell
      active={AppArea.Mentorships}
      title="Talep Detayı"
      backHref="/mentorships?tab=requests"
    >
      <div className="mx-auto max-w-[960px] px-4 py-6 sm:px-8">
        {requestsQuery.error || requestQuery.error ? (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {requestsQuery.error?.message ?? requestQuery.error?.message}
          </p>
        ) : null}
        {selectedId && !request && !requestQuery.error ? (
          <p className="mt-4 text-sm text-[#777]">Talep yükleniyor…</p>
        ) : null}
        {!selectedId && !requestsQuery.isLoading ? (
          <section className="mt-4 rounded-lg border border-[#e5e7eb] bg-white p-6 text-center">
            <p className="text-sm font-medium text-[#22262b]">
              Görüntülenecek bir talep seçilmedi.
            </p>
            <p className="mt-1 text-xs text-[#777]">
              Taleplerinden birini seçerek detayına gidebilirsin.
            </p>
            <SecondaryButton
              href="/mentorships?tab=requests"
              className="mt-4 inline-flex"
            >
              Taleplerime Git
            </SecondaryButton>
          </section>
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
              <h3 className="text-base font-semibold text-[#22262b]">
                Talep bilgileri
              </h3>
              <RequestDetailsPanel
                request={request}
                showSentAt={false}
                className="mt-4"
              />
            </section>

            <div className="mt-3">
              <DocumentRequestChecklist
                scope={{ mentorshipRequestId: request.id }}
                canUpload={
                  session?.role === UserRole.Mentee &&
                  (request.status === MentorshipRequestStatus.Accepted ||
                    request.status === MentorshipRequestStatus.CounterProposed)
                }
              />
            </div>

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
                      (message) =>
                        message.messageType ===
                        MentorshipRequestMessageType.MentorQuestion,
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
                      disabled={!reply.trim() || isSending}
                      onClick={() => void sendReply()}
                    >
                      {isSending ? "Gönderiliyor…" : "Yanıtı Gönder"}
                    </PrimaryButton>
                  </div>
                  {replyError ? (
                    <p role="alert" className="mt-3 text-sm text-red-700">
                      {replyError.message}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {request.status === MentorshipRequestStatus.CounterProposed ? (
                <div>
                  <h3 className="text-lg font-semibold">
                    Mentör tarafından şu saatler önerildi
                  </h3>
                  <p className="mt-2 text-sm text-[#777]">
                    Birini seçip kabul ettiğinde mentorluk aktif olur.
                  </p>
                  {proposedSlots.length === 0 ? (
                    <p className="mt-4 text-sm text-[#777]">
                      Önerilen saat bulunamadı.
                    </p>
                  ) : (
                    <div className="mt-4 grid gap-2">
                      {proposedSlots.map((slot, index) => {
                        const key = preferredSlotKey(slot) || slot.label;
                        const selected = key === selectedProposalKey;
                        return (
                          <button
                            key={`${key}-${index}`}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setSelectedProposalKey(key)}
                            className={`min-h-11 rounded-lg border px-4 text-left text-sm font-medium ${
                              selected
                                ? "border-[#e86f22] bg-[#fdebdd] text-[#e86f22]"
                                : "border-[#e5e7eb] bg-white text-[#22262b] hover:border-[#f2b78f]"
                            }`}
                          >
                            {slot.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div className="mt-4 flex justify-end">
                    <PrimaryButton
                      disabled={
                        !selectedProposal || acceptProposalMutation.isPending
                      }
                      onClick={() => void acceptMentorProposal()}
                    >
                      {acceptProposalMutation.isPending
                        ? "Kabul ediliyor…"
                        : "Saati kabul et"}
                    </PrimaryButton>
                  </div>
                  {proposalError ? (
                    <p role="alert" className="mt-3 text-sm text-red-700">
                      {proposalError}
                    </p>
                  ) : null}
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
                            disabled={slot.booked || isBooking}
                            onClick={() => void bookSlot(slot.id)}
                            className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-3 text-left text-xs hover:border-[#555] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {formatSlotDateTime(slot.startsAt)} ·{" "}
                            {slot.durationMinutes} dk
                            {slot.booked ? " · Dolu" : ""}
                          </button>
                        ))}
                      </div>
                      {!availabilityQuery.isLoading &&
                      !availabilityQuery.data?.length ? (
                        <p className="mt-3 text-sm text-[#777]">
                          Mentor henüz müsaitlik zamanı paylaşmadı.
                        </p>
                      ) : null}
                      {scheduleError ? (
                        <p role="alert" className="mt-3 text-sm text-red-700">
                          {scheduleError.message}
                        </p>
                      ) : null}
                    </>
                  )}

                  {session ? (
                    <div
                      id="messages"
                      className="mt-6 scroll-mt-24 border-t border-[#e5e7eb] pt-4"
                    >
                      <div className="rounded-2xl border border-[#f2b78f] bg-[#fff9f5] p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#e86f22]">
                            <FileUp className="size-5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold">
                              Görüşme dosyanı paylaş
                            </h3>
                            <p className="mt-1 text-xs text-[#676e78]">
                              PDF veya DOCX · En fazla 10 MB. Dosya güvenli
                              şekilde yüklenir ve mentora mesaj olarak
                              bildirilir.
                            </p>
                          </div>
                          <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#e86f22] px-4 text-xs font-semibold text-white">
                            <Upload className="size-4" />
                            {fileUpload.isPending
                              ? "Yükleniyor…"
                              : "Dosya yükle"}
                            <input
                              type="file"
                              accept=".pdf,.docx"
                              disabled={fileUpload.isPending}
                              className="hidden"
                              aria-label="Mentorluk dosyası yükle"
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) void fileUpload.mutateAsync(file);
                              }}
                            />
                          </label>
                        </div>
                        {fileUpload.data ? (
                          <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#b8e0c6] bg-white p-3 text-xs text-[#23824b]">
                            <CheckCircle2 className="size-4 shrink-0" />
                            <span className="truncate font-medium">
                              {fileUpload.data.stored.originalFilename}
                            </span>
                            <span className="ml-auto shrink-0">Gönderildi</span>
                          </div>
                        ) : null}
                        {fileUpload.error ? (
                          <p role="alert" className="mt-3 text-xs text-red-700">
                            {fileUpload.error.message}
                          </p>
                        ) : null}
                      </div>
                      <h3 className="mt-6 text-sm font-semibold">
                        Mentor ile mesajlaş
                      </h3>
                      <div className="mt-3">
                        <ConversationThread
                          messages={request.messages}
                          viewerUserId={session.userId}
                          value={reply}
                          onChange={setReply}
                          onSend={() => void sendReply()}
                          isSending={isSending}
                          error={replyError}
                        />
                      </div>
                    </div>
                  ) : null}
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
                        <PrimaryButton href={mentorProfileHref(mentor.id)}>
                          Profili gör
                        </PrimaryButton>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>

            {request.status === MentorshipRequestStatus.Pending ||
            request.status === MentorshipRequestStatus.CounterProposed ? (
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
