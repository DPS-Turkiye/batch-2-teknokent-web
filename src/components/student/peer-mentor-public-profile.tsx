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
import { usePeerMentor } from "@/hooks/use-peer-mentoring";
import { initials } from "@/lib/utils";

const BACK_HREF = "/student/peer-mentoring";

/**
 * A peer mentor's profile as students see it: who they are, the topics they help with, why they were recommended and
 * the request button. Built from the mentor card the directory returns.
 */
export function PeerMentorPublicProfile({ mentorId }: { mentorId: string }) {
  const t = useTranslations("iaIskur.take.profile");
  const tDiscover = useTranslations("iaIskur.take.discover");
  const tTopic = useTranslations("peerTopics");
  const view = usePeerMentor(mentorId);
  const { mentor } = view;

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
          </Card>
          <aside className="flex w-full flex-col gap-6 lg:w-[400px] lg:shrink-0">
            <WhyRecommended reasons={view.reasons} />
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
