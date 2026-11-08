"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.

import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  FilterPills,
  Panel,
  QueryNotice,
  SearchField,
} from "@/components/admin/admin-ui";
import { BadgeChips } from "@/components/badges/badge-chips";
import { EmptyState } from "@/components/common/empty-state";
import { PeerMentorRequestDialog } from "@/components/student/peer-mentor-request-dialog";
import { usePeerMentorDirectory } from "@/hooks/use-peer-mentoring";
import type {
  PeerMentorCard,
  PeerTopicCategory,
} from "@/interfaces/peer-mentoring";

const ALL = "ALL";

/** Mentorluk Al › Akran mentorları: filter by category or text, then send a request. */
export function PeerMentorDirectory() {
  const t = useTranslations("odtuWorkspaces.student.peerMentoring.mentors");
  const tTopic = useTranslations("peerTopics");
  const directory = usePeerMentorDirectory();
  const [requesting, setRequesting] = useState<PeerMentorCard | null>(null);
  const mentors = directory.mentors.data;

  return (
    <section aria-labelledby="peer-mentors-title" className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2
          id="peer-mentors-title"
          className="text-[18px] font-semibold text-[#22262b]"
        >
          {t("title")}
        </h2>
        <SearchField
          value={directory.query}
          onChange={directory.setQuery}
          placeholder={t("search")}
        />
      </div>
      <FilterPills<PeerTopicCategory | typeof ALL>
        value={directory.category ?? ALL}
        onChange={(value) =>
          directory.setCategory(value === ALL ? null : value)
        }
        options={[
          { id: ALL, label: t("allCategories") },
          ...directory.categories.map((category) => ({
            id: category,
            label: tTopic(category),
          })),
        ]}
      />
      <QueryNotice
        isLoading={directory.mentors.isLoading}
        error={directory.mentors.error}
      />
      {mentors && mentors.length === 0 ? (
        <EmptyState
          className=""
          title={directory.filtered ? t("noMatch") : t("empty")}
        />
      ) : null}
      {mentors && mentors.length > 0 ? (
        <ul className="grid gap-4 md:grid-cols-2">
          {mentors.map((mentor) => (
            <li key={mentor.mentorId}>
              <PeerMentorCardView
                mentor={mentor}
                hasOpenRequest={directory.hasOpenRequest(mentor.mentorId)}
                onRequest={() => setRequesting(mentor)}
              />
            </li>
          ))}
        </ul>
      ) : null}
      {requesting ? (
        <PeerMentorRequestDialog
          mentor={requesting}
          onClose={() => setRequesting(null)}
        />
      ) : null}
    </section>
  );
}

/**
 * A peer mentor as students see them. Without onRequest it is a preview (the peer-mentor wizard shows the student
 * their own card before publishing), so no request button.
 */
export function PeerMentorCardView({
  mentor,
  hasOpenRequest = false,
  onRequest,
}: {
  mentor: PeerMentorCard;
  hasOpenRequest?: boolean;
  onRequest?: () => void;
}) {
  const t = useTranslations("odtuWorkspaces.student.peerMentoring.mentors");
  const tTopic = useTranslations("peerTopics");
  const blocked = hasOpenRequest || mentor.capacityFull;
  const facts = [
    mentor.department,
    mentor.classYear ? t("classYear", { year: mentor.classYear }) : null,
  ].filter(Boolean);

  return (
    <Panel>
      <article className="flex h-full flex-col gap-3 p-5">
        <header>
          <h3 className="text-[15px] font-semibold text-[#22262b]">
            {mentor.fullName}
          </h3>
          {facts.length > 0 ? (
            <p className="text-[12.5px] text-[#858c96]">{facts.join(" · ")}</p>
          ) : null}
        </header>
        <ul className="flex flex-wrap gap-1.5" aria-label={t("categories")}>
          {mentor.categories.map((category) => (
            <li
              key={category}
              className="rounded-full bg-[#f4f5f7] px-2.5 py-1 text-[11.5px] text-[#4a5059]"
            >
              {tTopic(category)}
            </li>
          ))}
        </ul>
        <p className="text-[13px] leading-5 text-[#4a5059]">
          {mentor.helpWith}
        </p>
        <BadgeChips badges={mentor.badges} max={2} />
        {mentor.recommendationReasons.length > 0 ? (
          <div>
            <p className="text-[12px] font-medium text-[#22262b]">{t("why")}</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[12.5px] text-[#676e78]">
              {mentor.recommendationReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {onRequest ? (
          <div className="mt-auto pt-1">
            <button
              type="button"
              onClick={onRequest}
              disabled={blocked}
              aria-label={
                blocked
                  ? undefined
                  : t("requestFrom", { name: mentor.fullName })
              }
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#22262b] px-4 text-[13px] font-medium text-white disabled:bg-[#f4f5f7] disabled:text-[#858c96]"
            >
              {hasOpenRequest
                ? t("requested")
                : mentor.capacityFull
                  ? t("full")
                  : t("request")}
            </button>
          </div>
        ) : null}
      </article>
    </Panel>
  );
}
