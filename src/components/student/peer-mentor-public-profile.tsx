"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

import { QueryNotice } from "@/components/admin/admin-ui";
import { Card } from "@/components/ia/card";
import { InitialsAvatar, Tag, TagTone } from "@/components/student/iskur-ui";
import {
  RequestButton,
  WhyRecommended,
} from "@/components/student/peer-mentor-directory";
import { PeerMentorRequestDialog } from "@/components/student/peer-mentor-request-dialog";
import { PeerMentorSharedEvidence } from "@/components/student/peer-mentor-shared-evidence";
import { usePeerMentor } from "@/hooks/use-peer-mentoring";
import { httpUrlOrNull, initials } from "@/lib/utils";

const BACK_HREF = "/student/peer-mentoring";

/**
 * A peer mentor's profile as students see it: who they are, the topics and sub-topics they help with, their
 * experience and links, why they were recommended, their weekly hours and the request button.
 */
export function PeerMentorPublicProfile({ mentorId }: { mentorId: string }) {
  const t = useTranslations("iaIskur.take.profile");
  const tDiscover = useTranslations("iaIskur.take.discover");
  const tTopic = useTranslations("peerTopics");
  const tSubTopic = useTranslations("studentProfileCompletion.subtopics");
  const tDay = useTranslations("options.weekday");
  const view = usePeerMentor(mentorId);
  const { mentor } = view;
  const linkedinUrl = httpUrlOrNull(mentor?.linkedinUrl);

  return (
    <div className="space-y-8">
      <Link
        href={BACK_HREF}
        className="inline-flex items-center gap-1.5 type-label text-text-secondary hover:text-text-primary"
      >
        <Image alt="" src="/ia/icons/arrow-left.svg" width={16} height={16} />
        {t("back")}
      </Link>
      <QueryNotice isLoading={view.isLoading} error={view.error} />
      {!view.isLoading && !view.error && !mentor ? (
        <p className="rounded-card border border-border-subtle bg-background-surface p-6 type-body text-text-secondary">
          {t("notFound")}
        </p>
      ) : null}
      {mentor && view.availability ? (
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <Card className="min-w-0 flex-1 space-y-6">
            <div className="flex flex-wrap items-center gap-5">
              <InitialsAvatar initials={initials(mentor.fullName)} size="lg" />
              <div className="space-y-2">
                <h1 className="type-h2 text-text-primary">{mentor.fullName}</h1>
                <p className="type-body text-text-secondary">
                  {mentor.department}
                  {mentor.department && mentor.classYear ? " · " : null}
                  {mentor.classYear
                    ? tDiscover("classYear", { year: mentor.classYear })
                    : null}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Tag>{t("peer")}</Tag>
                  {view.badgeVerified ? (
                    <Tag tone={TagTone.Success}>{t("badgeVerified")}</Tag>
                  ) : null}
                </div>
              </div>
            </div>
            <hr className="border-border-subtle" />
            <section aria-labelledby="mentor-topics" className="space-y-3">
              <h2 id="mentor-topics" className="type-label text-text-primary">
                {t("topics")}
              </h2>
              <ul className="flex flex-wrap gap-2">
                {mentor.categories.map((category) => (
                  <li key={category}>
                    <Tag tone={TagTone.Accent}>{tTopic(category)}</Tag>
                  </li>
                ))}
                {view.subTopics.map(({ id, entry }) => (
                  <li key={id}>
                    <Tag tone={TagTone.Accent}>
                      {entry ? tSubTopic(entry.labelKey) : id}
                    </Tag>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-labelledby="mentor-help" className="space-y-2">
              <h2 id="mentor-help" className="type-label text-text-primary">
                {t("helpWith")}
              </h2>
              <p className="type-body whitespace-pre-line text-text-secondary">
                {mentor.helpWith}
              </p>
            </section>
            {mentor.strongCourses.length > 0 ||
            mentor.projects.length > 0 ||
            mentor.erasmus ? (
              <section
                aria-labelledby="mentor-experience"
                className="space-y-3"
              >
                <h2
                  id="mentor-experience"
                  className="type-label text-text-primary"
                >
                  {t("experience")}
                </h2>
                <dl className="space-y-3">
                  <ExperienceLine
                    label={t("strongCourses")}
                    items={mentor.strongCourses}
                  />
                  <ExperienceLine
                    label={t("projects")}
                    items={mentor.projects}
                  />
                  <ExperienceLine
                    label={t("erasmus")}
                    items={mentor.erasmus ? [mentor.erasmus] : []}
                  />
                </dl>
              </section>
            ) : null}
            <PeerMentorSharedEvidence
              mentorId={mentorId}
              linkedinUrl={linkedinUrl}
            />
          </Card>
          <aside className="flex w-full flex-col gap-6 lg:w-[400px] lg:shrink-0">
            <WhyRecommended reasons={view.reasons} />
            <Card labelledBy="mentor-availability" className="space-y-4">
              <h2
                id="mentor-availability"
                className="type-title-card text-text-primary"
              >
                {t("availability")}
              </h2>
              {view.weeklyHours.length === 0 ? (
                <p className="type-body-sm text-text-secondary">
                  {t("noHours")}
                </p>
              ) : (
                <dl className="space-y-3">
                  {view.weeklyHours.map((range) => (
                    <div
                      key={`${range.dayOfWeek}-${range.start}-${range.end}`}
                      className="flex items-center justify-between gap-4"
                    >
                      <dt className="type-body-sm text-text-secondary">
                        {tDay(range.dayOfWeek)}
                      </dt>
                      <dd className="type-label text-text-primary">
                        {t("hoursRange", {
                          start: range.start,
                          end: range.end,
                        })}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              <p className="flex items-center justify-between gap-4 rounded-xl bg-card-featured-bg px-3 py-2.5">
                <span className="type-body-sm text-text-secondary">
                  {t("thisWeek")}
                </span>
                <span className="type-label text-text-accent">
                  {mentor.availableThisWeek
                    ? t("thisWeekOpen")
                    : t("thisWeekFull")}
                </span>
              </p>
            </Card>
            <Card className="space-y-3">
              <RequestButton
                mentor={mentor}
                availability={view.availability}
                onRequest={view.openRequest}
                fullWidth
              />
              <p className="type-caption text-text-muted">
                {t("requestNote", { name: mentor.fullName })}
              </p>
            </Card>
          </aside>
          {view.requesting ? (
            <PeerMentorRequestDialog
              mentor={mentor}
              onClose={view.closeRequest}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ExperienceLine({
  label,
  items,
}: {
  label: string;
  items: readonly string[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1">
      <dt className="type-caption text-text-muted">{label}</dt>
      <dd className="type-body-sm text-text-secondary">{items.join(" · ")}</dd>
    </div>
  );
}
