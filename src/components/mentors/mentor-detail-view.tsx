"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { MentorRequestDialog } from "@/components/mentors/mentor-request-dialog";
import { useAppSession } from "@/components/providers/session-provider";
import type {
  MentorAvailabilitySlot,
  MentorProfile,
} from "@/interfaces/mentor";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import type { StartupContext } from "@/interfaces/startup";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { useOptionLabel } from "@/hooks/use-option-label";
import {
  availabilityColumns,
  slotTimeLabel,
} from "@/lib/mentor-availability-days";
import {
  experienceDetail,
  experienceHeading,
  menteeLoadLabel,
} from "@/lib/mentor-detail";
import { mentorFirstName } from "@/lib/mentor-profile-request";

const cardClass =
  "space-y-2.5 rounded-[10px] border border-[#e4e7ea] bg-white p-4";
const cardHeadingClass = "text-base font-medium text-[#22262b]";
const detailClass = "text-xs text-[#676e78]";
const messageButtonClass =
  "flex w-full items-center justify-center rounded-2xl border border-[#e86f22] py-3 text-sm font-medium text-[#22262b] transition hover:bg-[#fff4ec]";

export function MentorDetailView({
  mentor,
  slots,
  startup,
}: {
  mentor: MentorProfile;
  slots: MentorAvailabilitySlot[];
  startup: StartupContext;
}) {
  const t = useTranslations("mentorDetail");
  const locale = useLocale();
  const optionLabel = useOptionLabel();
  const router = useRouter();
  const session = useAppSession();
  const mentorshipsQuery = useMentorshipRequests(UserRole.Mentee);
  const [requestOpen, setRequestOpen] = useState(false);
  const firstName = mentorFirstName(mentor.fullName);
  const columns = availabilityColumns(slots, new Date(), 5, locale);
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
    t("whyFallback", { name: mentor.fullName });
  const tags = mentor.specialties;
  const menteeLoad = menteeLoadLabel(mentor);
  const experiences = mentor.experiences ?? [];
  const programs = mentor.programNames ?? [];
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
      <nav className="flex gap-1.5 text-sm text-[#858c96]">
        <Link href="/mentorships" className="hover:text-[#e86f22]">
          {t("breadcrumb")}
        </Link>
        <span className="text-[13px]">›</span>
        <span className="text-[#22262b]">{mentor.fullName}</span>
      </nav>

      <section className="mt-5 flex flex-wrap items-start gap-[22px] py-[18px] sm:px-5">
        <span className="grid size-[88px] shrink-0 place-items-center rounded-full border border-[#e4e7ea] bg-[#fdebdd] text-[28px] font-medium text-[#a8480e]">
          {mentor.initials}
        </span>
        <div className="min-w-0 flex-1 space-y-6">
          <div className="space-y-3">
            <h1 className="text-[28px] font-medium leading-tight text-[#22262b]">
              {mentor.fullName}
            </h1>
            <p className="text-[15px] font-medium text-[#676e78]">
              {mentor.professionalTitle}
              {mentor.company ? ` · ${mentor.company}` : ""}
            </p>
          </div>
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag, index) => (
                <span
                  key={tag}
                  className={`rounded-[14px] px-2.5 py-1.5 text-xs font-medium ${
                    index === 0
                      ? "bg-[#fdebdd] text-[#e86f22]"
                      : "border border-[#e4e7ea] bg-[#fcfcfd] text-[#676e78]"
                  }`}
                >
                  {optionLabel("mentorTopic", tag)}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex w-full flex-col items-end justify-between gap-6 self-stretch sm:w-[325px]">
          {menteeLoad ? (
            <div className="space-y-[5px] self-start sm:self-end">
              <p className="text-xs text-[#858c96]">{t("activeMentees")}</p>
              <p className="text-2xl font-medium text-[#22262b]">
                {menteeLoad}
              </p>
            </div>
          ) : mentor.availabilityLabel ? (
            <p className="text-xs text-[#858c96]">{mentor.availabilityLabel}</p>
          ) : (
            <span />
          )}
          {acceptedRequest ? (
            <Link
              href={`/mentor-request/status?request=${encodeURIComponent(acceptedRequest.id)}#messages`}
              title={t("openChat")}
              className={messageButtonClass}
            >
              {t("message")}
            </Link>
          ) : (
            <button
              type="button"
              disabled
              title={t("messageLocked")}
              className={`${messageButtonClass} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {t("message")}
            </button>
          )}
        </div>
      </section>

      <section className="mt-5 space-y-2.5 rounded-[20px] bg-[#fff4ec] p-4">
        <h2 className="text-[15px] font-medium text-[#22262b]">
          {t("whyTitle")}
        </h2>
        <p className="text-[13px] leading-5 text-[#676e78]">{why}</p>
      </section>

      <div className="mt-5 grid items-start gap-[18px] lg:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-3.5">
          {mentor.activeMenteeCount !== undefined ? (
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-2.5 rounded-[10px] border border-[#e86f22] bg-white p-4">
                <p className="text-[22px] font-medium text-[#22262b]">
                  {mentor.activeMenteeCount}
                </p>
                <p className="text-xs text-[#858c96]">{t("activeMentees")}</p>
              </div>
              <div className="space-y-2.5 rounded-[10px] border border-[#e4e7ea] bg-white p-4">
                <p className="text-[22px] font-medium text-[#f97316]">
                  {mentor.completedMentorshipCount ?? 0}
                </p>
                <p className="text-xs text-[#858c96]">{t("completed")}</p>
              </div>
            </div>
          ) : null}

          <section className={cardClass}>
            <h2 className={cardHeadingClass}>{t("infoTitle")}</h2>
            <p className={detailClass}>
              {t("format", {
                mode: mentor.meetingMode
                  ? optionLabel("meetingFormat", mentor.meetingMode)
                  : t("onlineFallback"),
              })}
            </p>
            <p className={detailClass}>
              {t("duration", { minutes: durationMinutes })}
            </p>
            {programs.length > 0 ? (
              <p className={detailClass}>
                {t("program", { names: programs.join(", ") })}
              </p>
            ) : null}
            {mentor.communicationPreference ? (
              <p className={detailClass}>{mentor.communicationPreference}</p>
            ) : null}
            <p className={detailClass}>
              {t("responseTime", {
                time: optionLabel("responseTime", mentor.responseTimeLabel),
              })}
            </p>
          </section>

          {about ? (
            <section className={cardClass}>
              <h2 className={cardHeadingClass}>{t("about")}</h2>
              <p className="text-[13px] leading-5 text-[#676e78]">{about}</p>
            </section>
          ) : null}

          <section className={cardClass}>
            <h2 className={cardHeadingClass}>{t("experience")}</h2>
            {experiences.length > 0 ? (
              experiences.map((experience, index) => (
                <div key={index} className="space-y-[3px]">
                  <p className="text-[13px] font-medium text-[#22262b]">
                    {experienceHeading(experience)}
                  </p>
                  {experienceDetail(experience) ? (
                    <p className="text-xs text-[#858c96]">
                      {experienceDetail(experience)}
                    </p>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="space-y-[3px]">
                <p className="text-[13px] font-medium text-[#22262b]">
                  {mentor.professionalTitle}
                  {mentor.company ? ` · ${mentor.company}` : ""}
                </p>
                {mentor.startupStages ? (
                  <p className="text-xs text-[#858c96]">
                    {mentor.startupStages}
                  </p>
                ) : null}
              </div>
            )}
          </section>

          {tags.length > 0 ? (
            <section className={cardClass}>
              <h2 className={cardHeadingClass}>{t("topics")}</h2>
              <ul className="space-y-2.5 text-[13px] text-[#676e78]">
                {tags.map((tag) => (
                  <li key={tag} className="flex gap-2">
                    <span aria-hidden className="font-medium text-[#e86f22]">
                      •
                    </span>
                    {optionLabel("mentorTopic", tag)}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="space-y-3.5">
          <section className={cardClass}>
            <div className="space-y-2.5">
              <h2 className={cardHeadingClass}>{t("availability")}</h2>
              <p className="text-xs text-[#858c96]">{t("nextDays")}</p>
            </div>
            {columns.length === 0 ? (
              <p className="text-[13px] text-[#676e78]">{t("noSlots")}</p>
            ) : (
              <div className="flex overflow-x-auto px-2">
                {columns.map((column, index) => (
                  <div
                    key={column.key}
                    className={`flex min-w-[58px] flex-1 flex-col items-center gap-3 ${
                      index > 0 ? "border-l border-dashed border-[#ccd2e3]" : ""
                    }`}
                  >
                    <p className="text-xs font-medium text-[#676e78]">
                      {column.label}
                    </p>
                    <div className="flex flex-col items-center gap-1.5 pb-2">
                      {column.slots.map((slot) => (
                        <span
                          key={slot.id}
                          className="rounded-[14px] bg-[#fdebdd] px-2.5 py-1.5 text-xs font-medium text-[#e86f22]"
                        >
                          {slotTimeLabel(slot.startsAt, locale)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="flex items-center gap-1.5 text-[11px] text-[#858c96]">
              <span aria-hidden className="text-[10px] text-[#e86f22]">
                ●
              </span>
              {t("pickable")}
            </p>
          </section>

          <section className="space-y-2.5 rounded-[10px] border border-[#e4e7ea] bg-[#fdebdd] p-4">
            <h2 className="text-[15px] font-medium text-[#22262b]">
              {t("workWith", { name: firstName })}
            </h2>
            <p className="text-xs leading-[18px] text-[#676e78]">
              {t("workWithBody")}
            </p>
            <button
              type="button"
              onClick={openRequest}
              className="rounded-lg bg-[#e86f22] px-4 py-[11px] text-sm font-medium text-white transition hover:bg-[#ce5e19]"
            >
              {t("sendRequest")}
            </button>
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
