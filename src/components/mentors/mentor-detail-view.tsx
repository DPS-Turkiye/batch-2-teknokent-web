"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MessageCircle } from "lucide-react";

import { MentorRequestDialog } from "@/components/mentors/mentor-request-dialog";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { useAppSession } from "@/components/providers/session-provider";
import type {
  MentorAvailabilitySlot,
  MentorProfile,
} from "@/interfaces/mentor";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import type { StartupContext } from "@/interfaces/startup";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import {
  availabilityColumns,
  slotTimeLabel,
} from "@/lib/mentor-availability-days";
import { mentorFirstName } from "@/lib/mentor-profile-request";

export function MentorDetailView({
  mentor,
  slots,
  startup,
}: {
  mentor: MentorProfile;
  slots: MentorAvailabilitySlot[];
  startup: StartupContext;
}) {
  const router = useRouter();
  const session = useAppSession();
  const mentorshipsQuery = useMentorshipRequests(UserRole.Mentee);
  const [requestOpen, setRequestOpen] = useState(false);
  const firstName = mentorFirstName(mentor.fullName);
  const columns = availabilityColumns(slots);
  const durationMinutes =
    slots.find((slot) => !slot.booked)?.durationMinutes ?? 45;
  const about = [
    mentor.experienceLevel,
    mentor.sectorExperience,
    mentor.mentoringStyle,
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(". ");
  const why =
    mentor.recommendationReasons[0] ||
    `${mentor.fullName} uzmanlığı, ihtiyacınla örtüşüyor.`;
  const tags = mentor.specialties;
  const acceptedRequest = mentorshipsQuery.data?.find(
    (request) =>
      request.mentorId === mentor.id &&
      request.status === MentorshipRequestStatus.Accepted,
  );

  function openRequest() {
    if (!session?.fullName) {
      router.push("/login");
      return;
    }
    setRequestOpen(true);
  }

  return (
    <div className="mx-auto w-full max-w-[1116px] px-4 pb-14 pt-6 sm:px-8">
      <nav className="text-xs text-[#858c96]">
        <Link href="/mentorships" className="hover:text-[#e86f22]">
          Mentorluklarım
        </Link>
        <span className="mx-1.5">›</span>
        <span className="text-[#676e78]">{mentor.fullName}</span>
      </nav>

      <section className="mt-6 flex flex-wrap items-start gap-5">
        <span className="grid size-[88px] shrink-0 place-items-center rounded-full bg-[#fdebdd] text-[28px] font-semibold text-[#676e78]">
          {mentor.initials}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-[28px] font-semibold leading-tight text-[#22262b]">
            {mentor.fullName}
          </h1>
          <p className="mt-1 text-sm text-[#676e78]">
            {mentor.professionalTitle}
            {mentor.company ? ` · ${mentor.company}` : ""}
          </p>
          {tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={tag}
                  className={`inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-medium ${
                    index === 0
                      ? "bg-[#e86f22] text-white"
                      : "bg-[#f1f3f5] text-[#676e78]"
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="ml-auto flex w-full flex-col items-end gap-6 sm:w-auto">
          {mentor.availabilityLabel ? (
            <p className="text-right text-xs text-[#858c96]">
              {mentor.availabilityLabel}
            </p>
          ) : null}
          <SecondaryButton
            href={
              acceptedRequest
                ? `/mentor-request/status?request=${encodeURIComponent(acceptedRequest.id)}#messages`
                : undefined
            }
            disabled={!acceptedRequest}
            title={
              acceptedRequest
                ? "Mesajlaşmayı aç"
                : "Mesajlaşma, mentor talebinizi kabul ettiğinde açılır."
            }
            className="min-w-[200px] gap-2"
          >
            <MessageCircle className="size-4" />
            Mesaj gönder
          </SecondaryButton>
        </div>
      </section>

      <section className="mt-6 rounded-[10px] border border-[#f2b78f] bg-[#fff9f5] px-4 py-4">
        <h2 className="text-sm font-semibold text-[#e86f22]">
          Bu mentor neden sana önerildi?
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#676e78]">{why}</p>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.8fr)_390px]">
        <div className="space-y-3.5">
          {about ? (
            <section className="rounded-[10px] border border-[#e4e7ea] bg-white p-4">
              <h2 className="text-base font-semibold text-[#22262b]">
                Hakkında
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#676e78]">{about}</p>
            </section>
          ) : null}

          <section className="rounded-[10px] border border-[#e4e7ea] bg-white p-4">
            <h2 className="text-base font-semibold text-[#22262b]">Deneyim</h2>
            <div className="mt-3">
              <p className="text-sm font-medium text-[#22262b]">
                {mentor.professionalTitle}
                {mentor.company ? ` · ${mentor.company}` : ""}
              </p>
              {mentor.startupStages ? (
                <p className="mt-1 text-xs text-[#858c96]">
                  {mentor.startupStages}
                </p>
              ) : null}
            </div>
          </section>

          {tags.length > 0 ? (
            <section className="rounded-[10px] border border-[#e4e7ea] bg-white p-4">
              <h2 className="text-base font-semibold text-[#22262b]">
                Bu mentorla hangi konuları çalışabilirsin?
              </h2>
              <ul className="mt-3 space-y-2.5 text-sm text-[#676e78]">
                {tags.map((tag) => (
                  <li key={tag}>• {tag}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="space-y-3.5">
          <section className="rounded-[10px] border border-[#e4e7ea] bg-white p-4">
            <h2 className="text-base font-semibold text-[#22262b]">Uygunluk</h2>
            <p className="mt-1 text-xs text-[#858c96]">Önümüzdeki 7 gün</p>
            {columns.length === 0 ? (
              <p className="mt-4 text-sm text-[#676e78]">
                Şu an seçilebilir bir saat yok. Yine de mentorluk talebi
                gönderebilirsin.
              </p>
            ) : (
              <div className="mt-4 flex gap-2 overflow-x-auto">
                {columns.map((column, index) => (
                  <div
                    key={column.key}
                    className={`flex min-w-[58px] flex-1 flex-col items-center ${
                      index > 0 ? "border-l border-[#e4e7ea] pl-2" : ""
                    }`}
                  >
                    <p className="text-[11px] font-medium text-[#676e78]">
                      {column.label}
                    </p>
                    <div className="mt-2 flex w-full flex-col gap-1.5">
                      {column.slots.map((slot) => (
                        <span
                          key={slot.id}
                          className="grid min-h-7 place-items-center rounded-full bg-[#fdede0] px-1 text-[11px] font-medium text-[#c85816]"
                        >
                          {slotTimeLabel(slot.startsAt)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 flex items-center gap-2 text-[11px] text-[#858c96]">
              <span className="size-1.5 rounded-full bg-[#e86f22]" />
              Seçilebilir saat
            </p>
          </section>

          <section className="rounded-[10px] border border-[#e4e7ea] bg-white p-4">
            <h2 className="text-base font-semibold text-[#22262b]">
              Mentorluk bilgisi
            </h2>
            <dl className="mt-3 space-y-2.5 text-xs text-[#676e78]">
              <div>Format · {mentor.meetingMode || "Online"}</div>
              <div>Süre · {durationMinutes} dk</div>
              {mentor.communicationPreference ? (
                <div>{mentor.communicationPreference}</div>
              ) : null}
              <div>Yanıt süresi · {mentor.responseTimeLabel}</div>
            </dl>
          </section>

          <section className="rounded-[10px] bg-[#fff9f5] p-4">
            <h2 className="text-sm font-semibold text-[#22262b]">
              {firstName} ile çalışmak ister misin?
            </h2>
            <p className="mt-2 text-xs leading-5 text-[#676e78]">
              Mentorluk ihtiyacınla birlikte talebini gönder. Kabul edildiğinde
              ilk görüşme saatini netleştirebilirsin.
            </p>
            <PrimaryButton className="mt-3 min-h-10" onClick={openRequest}>
              Mentorluk talebi gönder
            </PrimaryButton>
          </section>
        </aside>
      </div>

      {requestOpen ? (
        <MentorRequestDialog
          mentor={mentor}
          slots={slots}
          startup={startup}
          onClose={() => setRequestOpen(false)}
          onSent={(requestId) =>
            router.push(
              `/mentor-request/sent?request=${encodeURIComponent(requestId)}`,
            )
          }
        />
      ) : null}
    </div>
  );
}
