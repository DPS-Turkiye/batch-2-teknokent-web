"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.

import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { PageHeading, Panel } from "@/components/admin/admin-ui";
import { MyBadgesSection } from "@/components/badges/my-badges-section";
import { EmptyState } from "@/components/common/empty-state";
import {
  GoalField,
  SubtopicPicker,
  TopicPicker,
} from "@/components/student/interest-pickers";
import {
  useStudentInstitution,
  useStudentInterests,
} from "@/hooks/use-student-profile";
import { formatDateTime } from "@/lib/utils";

const buttonClass =
  "rounded-full border border-[#d4d8dd] px-4 py-2 text-sm disabled:opacity-50";

export function StudentProfileView() {
  const t = useTranslations("odtuWorkspaces.student.profile");
  return (
    <div className="max-w-3xl space-y-8">
      <PageHeading title={t("title")} subtitle={t("subtitle")} />
      <InstitutionSection />
      <InterestsSection />
      <MyBadgesSection />
    </div>
  );
}

function Section({
  id,
  title,
  note,
  children,
}: {
  id: string;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <div>
        <h2 id={id} className="text-[18px] font-semibold text-[#22262b]">
          {title}
        </h2>
        {note ? <p className="text-[12.5px] text-[#858c96]">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

function InstitutionSection() {
  const t = useTranslations("odtuWorkspaces.student.profile.institution");
  const tLevel = useTranslations("studyLevel");
  const locale = useLocale();
  const institution = useStudentInstitution();
  const record = institution.record;

  return (
    <Section id="profile-institution" title={t("title")} note={t("readOnly")}>
      {institution.isLoading ? (
        <p role="status" className="text-sm text-[#858c96]">
          {t("loading")}
        </p>
      ) : institution.missing ? (
        <EmptyState
          className=""
          title={t("missingTitle")}
          body={t("missingBody")}
        />
      ) : institution.error ? (
        <div role="alert" className="space-y-2 text-sm text-[#d9464b]">
          <p>{t("loadError")}</p>
          <button
            type="button"
            className={buttonClass}
            disabled={institution.isFetching}
            onClick={institution.retry}
          >
            {t("retry")}
          </button>
        </div>
      ) : record ? (
        <Panel>
          <dl className="grid gap-x-6 gap-y-4 p-6 sm:grid-cols-2">
            <Fact label={t("fullName")} value={record.fullName} />
            <Fact label={t("email")} value={record.email} />
            <Fact label={t("faculty")} value={record.faculty} />
            <Fact label={t("department")} value={record.departmentName} />
            <Fact
              label={t("classYear")}
              value={
                record.classYear
                  ? t("classYearValue", { year: record.classYear })
                  : null
              }
            />
            <Fact
              label={t("programLevel")}
              value={record.programLevel ? tLevel(record.programLevel) : null}
            />
            <Fact
              label={t("advisor")}
              value={
                record.advisor
                  ? [record.advisor.academicTitle, record.advisor.fullName]
                      .filter(Boolean)
                      .join(" ")
                  : null
              }
            />
            <Fact
              label={t("iskur")}
              value={record.iskurParticipant ? t("yes") : t("no")}
            />
          </dl>
          <p className="border-t border-[#f0f2f4] px-6 py-3 text-[12px] text-[#858c96]">
            {record.syncedAt
              ? t("syncedAt", {
                  date: formatDateTime(record.syncedAt, locale),
                })
              : t("notSynced")}{" "}
            {t("help")}
          </p>
        </Panel>
      ) : null}
    </Section>
  );
}

function Fact({ label, value }: { label: string; value: string | null }) {
  const t = useTranslations("odtuWorkspaces.student.profile.institution");
  return (
    <div>
      <dt className="text-[12px] text-[#858c96]">{label}</dt>
      <dd className="text-[14px] text-[#22262b]">{value ?? t("unknown")}</dd>
    </div>
  );
}

function InterestsSection() {
  const t = useTranslations("odtuWorkspaces.student.profile.interests");
  const tSub = useTranslations("studentProfileCompletion.subtopics");
  const topicLabel = useTranslations("peerTopics");
  const interests = useStudentInterests();
  const { saved, draft } = interests;

  return (
    <Section
      id="profile-interests"
      title={t("title")}
      note={t("fixtureNotice")}
    >
      {interests.isLoading ? (
        <p role="status" className="text-sm text-[#858c96]">
          {t("loading")}
        </p>
      ) : interests.loadError ? (
        <div role="alert" className="space-y-2 text-sm text-[#d9464b]">
          <p>{t("loadError")}</p>
          <button
            type="button"
            className={buttonClass}
            disabled={interests.isFetching}
            onClick={interests.retry}
          >
            {t("retry")}
          </button>
        </div>
      ) : draft ? (
        <Panel>
          <form
            className="space-y-5 p-6"
            onSubmit={(event) => {
              event.preventDefault();
              interests.save();
            }}
          >
            <fieldset
              disabled={interests.isSaving}
              className="min-w-0 space-y-5"
            >
              <legend className="sr-only">{t("title")}</legend>
              <TopicPicker
                categories={interests.categories}
                selected={draft.topics}
                onToggle={interests.toggleTopic}
              />
              <SubtopicPicker
                groups={interests.chosen}
                selected={draft.subtopics}
                onToggle={interests.toggleSubtopic}
              />
              <GoalField value={draft.goal} onChange={interests.setGoal} />
              {interests.saveError ? (
                <p role="alert" className="text-sm text-[#d9464b]">
                  {t("saveError")}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <button type="submit" className={buttonClass}>
                  {interests.isSaving ? t("saving") : t("save")}
                </button>
                <button
                  type="button"
                  className={buttonClass}
                  onClick={interests.cancel}
                >
                  {t("cancel")}
                </button>
              </div>
            </fieldset>
          </form>
        </Panel>
      ) : saved ? (
        <Panel>
          <div className="space-y-4 p-6">
            {saved.topics.length === 0 && !saved.goal ? (
              <p className="text-sm text-[#676e78]">{t("empty")}</p>
            ) : (
              <dl className="space-y-4">
                <div>
                  <dt className="text-[12px] text-[#858c96]">{t("topics")}</dt>
                  <dd>
                    <ul className="mt-1 flex flex-wrap gap-1.5">
                      {interests.chosen.map((item) => (
                        <li
                          key={item.id}
                          className="rounded-full bg-[#f4f5f7] px-2.5 py-1 text-[12px] text-[#4a5059]"
                        >
                          {topicLabel(item.id)}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
                {saved.subtopics.length > 0 ? (
                  <div>
                    <dt className="text-[12px] text-[#858c96]">
                      {t("subtopics")}
                    </dt>
                    <dd className="text-[14px] text-[#22262b]">
                      {interests.chosen
                        .flatMap((item) => item.subtopics)
                        .filter((sub) => saved.subtopics.includes(sub.id))
                        .map((sub) => tSub(sub.labelKey))
                        .join(", ")}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-[12px] text-[#858c96]">{t("goal")}</dt>
                  <dd className="whitespace-pre-line text-[14px] text-[#22262b]">
                    {saved.goal || t("noGoal")}
                  </dd>
                </div>
              </dl>
            )}
            <button
              type="button"
              className={buttonClass}
              onClick={interests.startEditing}
            >
              {t("edit")}
            </button>
          </div>
        </Panel>
      ) : null}
    </Section>
  );
}
