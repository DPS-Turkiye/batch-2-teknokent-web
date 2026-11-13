"use client";

import { Check, Lightbulb, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import type { ReactNode } from "react";

import { QueryNotice } from "@/components/admin/admin-ui";
import { Button, ButtonSize, ButtonVariant } from "@/components/ia/button";
import { InlineAlert } from "@/components/ia/inline-alert";
import { StatusTone } from "@/components/ia/status-badge";
import {
  CATEGORY_ART,
  InitialsAvatar,
  Tag,
} from "@/components/student/iskur-ui";
import { PeerMentorRequestDialog } from "@/components/student/peer-mentor-request-dialog";
import { usePeerMentorDirectory } from "@/hooks/use-peer-mentoring";
import {
  PeerTopicCategory,
  type PeerMentorCard,
} from "@/interfaces/peer-mentoring";
import { isEnumValue } from "@/lib/enum";
import { peerMentorProfileHref } from "@/lib/peer-mentoring";
import { initials } from "@/lib/utils";
import { PeerRequestAvailability } from "@/types/iskur-student";

const ALL = "ALL";
const FILTER_BASE =
  "h-10 rounded-full border bg-background-surface px-4 type-label focus-visible:outline-2 focus-visible:outline-border-selected";
const FILTER_CLASS = `${FILTER_BASE} border-border-default text-text-primary`;

/** Mentorluk Al › Keşfet: the active categories, the recommended mentors, and a searchable list. */
export function PeerMentorDirectory() {
  const t = useTranslations("iaIskur.take.discover");
  const tTopic = useTranslations("peerTopics");
  const tSubTopic = useTranslations("studentProfileCompletion.subtopics");
  const directory = usePeerMentorDirectory();
  const mentors = directory.mentors.data;

  return (
    <div className="space-y-10">
      <Section
        id="peer-categories-title"
        title={t("categoriesTitle")}
        hint={t("categoriesHint")}
      >
        {directory.noActiveCategories ? (
          <InlineAlert tone={StatusTone.Info}>{t("noCategories")}</InlineAlert>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {directory.categories.map((category) => {
              const art = CATEGORY_ART[category];
              const active = directory.category === category;
              const count = directory.countOf(category);
              return (
                <li key={category}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => directory.toggleCategory(category)}
                    className={`flex min-h-24 w-full items-center gap-4 rounded-[20px] border bg-background-surface p-5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-selected ${
                      active
                        ? "border-brand-odtu-primary"
                        : "border-border-default hover:bg-background-subtle"
                    }`}
                  >
                    {art ? (
                      <Image
                        src={art.src}
                        alt=""
                        width={art.width}
                        height={art.height}
                        className="shrink-0"
                      />
                    ) : null}
                    <span className="flex flex-col gap-1">
                      <span className="type-label text-text-primary">
                        {tTopic(category)}
                      </span>
                      {count === undefined ? null : (
                        <span className="type-caption text-text-muted">
                          <span className="sr-only">,</span>{" "}
                          {t("mentorCount", { count })}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {directory.recommended.length > 0 ? (
        <Section
          id="peer-recommended-title"
          title={t("recommendedTitle")}
          hint={t("recommendedHint")}
        >
          <ul className="grid gap-5 lg:grid-cols-3">
            {directory.recommended.map((mentor) => (
              <li key={mentor.mentorId}>
                <article
                  aria-label={mentor.fullName}
                  className="flex h-full flex-col gap-5 rounded-card border border-border-subtle bg-background-surface p-6"
                >
                  <MentorHeading mentor={mentor} withRole />
                  <WhyRecommended reasons={directory.reasonsOf(mentor)} />
                  <div className="mt-auto flex gap-3">
                    <Button
                      href={peerMentorProfileHref(mentor.mentorId)}
                      variant={ButtonVariant.Ghost}
                    >
                      {t("seeProfile")}
                      <NameSuffix name={mentor.fullName} />
                    </Button>
                    <RequestButton
                      mentor={mentor}
                      availability={directory.availabilityOf(mentor)}
                      onRequest={() => directory.openRequest(mentor)}
                    />
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section id="peer-search-title" title={t("searchTitle")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <label className="relative block sm:w-96">
            <span className="sr-only">{t("search")}</span>
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-icon-muted"
            />
            <input
              type="search"
              value={directory.query}
              onChange={(event) => directory.setQuery(event.target.value)}
              placeholder={t("search")}
              className="h-12 w-full rounded-input border border-border-control bg-background-surface pr-4 pl-11 type-body text-text-primary placeholder:text-text-placeholder focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-border-selected"
            />
          </label>
          <label className="block">
            <span className="sr-only">{t("categoryFilter")}</span>
            <select
              value={directory.category ?? ALL}
              onChange={(event) => {
                const { value } = event.target;
                directory.setCategory(
                  isEnumValue(PeerTopicCategory, value) ? value : null,
                );
              }}
              className={FILTER_CLASS}
            >
              <option value={ALL}>{t("allCategories")}</option>
              {directory.categories.map((category) => (
                <option key={category} value={category}>
                  {tTopic(category)}
                </option>
              ))}
            </select>
          </label>
          {directory.subTopicOptions.length > 0 ? (
            <label className="block">
              <span className="sr-only">{t("subTopicFilter")}</span>
              <select
                value={directory.subTopic ?? ALL}
                onChange={(event) => {
                  const { value } = event.target;
                  directory.setSubTopic(value === ALL ? null : value);
                }}
                className={FILTER_CLASS}
              >
                <option value={ALL}>{t("allSubTopics")}</option>
                {directory.subTopicOptions.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {tSubTopic(sub.labelKey)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <button
            type="button"
            aria-pressed={directory.availableThisWeek}
            onClick={directory.toggleAvailableThisWeek}
            className={`${FILTER_BASE} inline-flex items-center gap-1.5 ${
              directory.availableThisWeek
                ? "border-brand-odtu-primary text-text-accent"
                : "border-border-default text-text-primary"
            }`}
          >
            {directory.availableThisWeek ? (
              <Check aria-hidden className="size-4" />
            ) : null}
            {t("availableThisWeek")}
          </button>
        </div>
        <QueryNotice
          isLoading={directory.mentors.isLoading}
          error={directory.mentors.error}
        />
        {mentors?.length === 0 ? (
          <p className="rounded-card border border-border-subtle bg-background-surface p-6 type-body text-text-secondary">
            {directory.filtered ? t("noMatch") : t("empty")}
          </p>
        ) : null}
        {directory.others.length > 0 ? (
          <ul className="divide-y divide-border-subtle overflow-hidden rounded-card border border-border-subtle bg-background-surface">
            {directory.others.map((mentor) => (
              <li
                key={mentor.mentorId}
                className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between"
              >
                <MentorHeading mentor={mentor} />
                <div className="flex flex-wrap items-center gap-2">
                  {mentor.categories.map((category) => (
                    <Tag key={category}>{tTopic(category)}</Tag>
                  ))}
                  {mentor.availableThisWeek ? (
                    <span className="type-caption text-text-muted">
                      {t("availableThisWeek")}
                    </span>
                  ) : null}
                  <Button
                    href={peerMentorProfileHref(mentor.mentorId)}
                    variant={ButtonVariant.Secondary}
                    size={ButtonSize.Small}
                  >
                    {t("seeProfile")}
                    <NameSuffix name={mentor.fullName} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </Section>

      {directory.requesting ? (
        <PeerMentorRequestDialog
          mentor={directory.requesting}
          onClose={directory.closeRequest}
        />
      ) : null}
    </div>
  );
}

function Section({
  id,
  title,
  hint,
  children,
}: {
  id: string;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="space-y-4">
      <h2 id={id} className="flex flex-wrap items-baseline gap-2">
        <span className="type-title-card text-text-primary">{title}</span>
        {hint ? (
          <span className="type-caption text-text-muted">{hint}</span>
        ) : null}
      </h2>
      {children}
    </section>
  );
}

/** Avatar, name and "bölüm · sınıf" (or "bölüm · Akran Mentoru" on a recommended card). */
export function MentorHeading({
  mentor,
  withRole = false,
}: {
  mentor: PeerMentorCard;
  withRole?: boolean;
}) {
  const t = useTranslations("iaIskur.take.discover");
  return (
    <div className="flex min-w-0 items-center gap-3">
      <InitialsAvatar initials={initials(mentor.fullName)} />
      <div className="min-w-0">
        <h3 className="truncate type-title-card text-text-primary">
          {mentor.fullName}
        </h3>
        <p className="type-caption text-text-secondary">
          {mentor.department}
          {mentor.department ? " · " : null}
          {withRole
            ? t("role")
            : mentor.classYear
              ? t("classYear", { year: mentor.classYear })
              : null}
        </p>
      </div>
    </div>
  );
}

/** The "Neden önerildi?" box. */
export function WhyRecommended({ reasons }: { reasons: readonly string[] }) {
  const t = useTranslations("iaIskur.take.discover");
  if (reasons.length === 0) return null;
  return (
    <div className="space-y-2 rounded-2xl bg-card-featured-bg p-4">
      <p className="flex items-center gap-2 type-label text-text-accent">
        <Lightbulb aria-hidden className="size-4" />
        {t("why")}
      </p>
      <ul className="space-y-1.5">
        {reasons.map((reason) => (
          <li
            key={reason}
            className="flex items-start gap-2 type-body-sm text-text-primary"
          >
            <Check
              aria-hidden
              className="mt-0.5 size-3.5 shrink-0 text-text-accent"
            />
            {reason}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** "Mentorluk Talebi Gönder", or why it can't be sent now (an open request, no places left). */
export function RequestButton({
  mentor,
  availability,
  onRequest,
  fullWidth = false,
}: {
  mentor: PeerMentorCard;
  availability: PeerRequestAvailability;
  onRequest: () => void;
  fullWidth?: boolean;
}) {
  const t = useTranslations("iaIskur.take.discover");
  if (availability === PeerRequestAvailability.Open) {
    return (
      <Button onClick={onRequest} fullWidth={fullWidth} className="flex-1">
        {t("request")}
        <NameSuffix name={mentor.fullName} />
      </Button>
    );
  }
  return (
    <Button disabled fullWidth={fullWidth} className="flex-1">
      {availability === PeerRequestAvailability.Mentoring
        ? t("mentoring")
        : availability === PeerRequestAvailability.Requested
          ? t("requested")
          : t("full")}
    </Button>
  );
}

/**
 * The mentor's name after a repeated button's visible text, for screen readers only; the visible text stays first in
 * the accessible name, so voice control can still say "Profili Gör".
 */
export function NameSuffix({ name }: { name: string }) {
  const t = useTranslations("iaIskur.take.discover");
  return <span className="sr-only">{t("nameSuffix", { name })}</span>;
}
