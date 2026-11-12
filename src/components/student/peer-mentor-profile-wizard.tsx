"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.
import { useTranslations } from "next-intl";
import Link from "next/link";

import { PageHeading, Panel, QueryNotice } from "@/components/admin/admin-ui";
import { WeeklyAvailabilityEditor } from "@/components/availability/weekly-availability-editor";
import { useAppSession } from "@/components/providers/session-provider";
import {
  SubtopicPicker,
  TopicPicker,
} from "@/components/student/interest-pickers";
import { PeerMentorCardView } from "@/components/student/peer-mentor-directory";
import { useMyBadges } from "@/hooks/use-badges";
import { useInstitutionRecord } from "@/hooks/use-institution-record";
import {
  PEER_MENTOR_WIZARD_STEPS,
  PeerMentorWizardStep,
  usePeerMentorWizard,
} from "@/hooks/use-peer-mentor-give";
import { BadgeStatus } from "@/interfaces/badges";
import { PEER_MENTOR_GIVE_HREF } from "@/lib/peer-mentoring";

const buttonClass =
  "rounded-full border border-[#d4d8dd] px-4 py-2 text-sm disabled:opacity-50";
/** The step's main action (Devam et, and Yayınla on the preview), set apart from Geri and Vazgeç. */
const primaryButtonClass =
  "rounded-full border border-[#22262b] bg-[#22262b] px-4 py-2 text-sm font-medium text-white disabled:opacity-50";
const fieldClass =
  "w-full rounded-xl border border-[#d4d8dd] bg-white p-3 text-[13px]";

/**
 * The peer-mentor profile wizard (board 5.3): categories → sub-topics → experience → what you can help with → links →
 * weekly availability and capacity → preview → publish. Opens with the published answers when editing.
 */
export function PeerMentorProfileWizard() {
  const t = useTranslations("odtuWorkspaces.student.peerMentoring.wizard");
  const wizard = usePeerMentorWizard();
  const { step, draft } = wizard;
  const last = step === PeerMentorWizardStep.Preview;

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeading
        title={wizard.existing ? t("editTitle") : t("title")}
        subtitle={t("subtitle")}
      />
      <QueryNotice isLoading={wizard.isLoading} error={wizard.loadError} />
      {wizard.isLoading || wizard.loadError ? null : (
        <Panel>
          <form
            className="space-y-6 p-6"
            onSubmit={(event) => {
              event.preventDefault();
              if (last) wizard.publish();
              else wizard.next();
            }}
          >
            <fieldset
              disabled={wizard.isPublishing}
              className="min-w-0 space-y-5"
            >
              <legend className="mb-4 text-lg font-semibold">
                {t("step", {
                  number: step + 1,
                  total: PEER_MENTOR_WIZARD_STEPS.length,
                })}
                : {t(`steps.${step}`)}
              </legend>
              {step === PeerMentorWizardStep.Categories ? (
                <TopicPicker
                  categories={wizard.categories}
                  selected={draft.topics}
                  onToggle={wizard.toggleTopic}
                />
              ) : null}
              {step === PeerMentorWizardStep.Subtopics ? (
                <SubtopicPicker
                  groups={wizard.subtopicGroups}
                  selected={draft.subtopics}
                  onToggle={wizard.toggleSubtopic}
                />
              ) : null}
              {step === PeerMentorWizardStep.Experience ? (
                <div className="space-y-4">
                  <TextArea
                    label={t("strongCourses")}
                    hint={t("onePerLine")}
                    value={draft.strongCourses}
                    onChange={(value) =>
                      wizard.setField("strongCourses", value)
                    }
                  />
                  <TextArea
                    label={t("projects")}
                    hint={t("onePerLine")}
                    value={draft.projects}
                    onChange={(value) => wizard.setField("projects", value)}
                  />
                  <label className="block space-y-1.5 text-sm">
                    <span>{t("erasmus")}</span>
                    <input
                      className={fieldClass}
                      value={draft.erasmus}
                      maxLength={500}
                      onChange={(event) =>
                        wizard.setField("erasmus", event.target.value)
                      }
                    />
                  </label>
                </div>
              ) : null}
              {step === PeerMentorWizardStep.HelpWith ? (
                <TextArea
                  label={t("helpWith")}
                  hint={t("helpWithHint")}
                  value={draft.helpWith}
                  maxLength={2000}
                  onChange={(value) => wizard.setField("helpWith", value)}
                />
              ) : null}
              {step === PeerMentorWizardStep.Links ? (
                <div className="space-y-3">
                  <label className="block space-y-1.5 text-sm">
                    <span>{t("linkedin")}</span>
                    <input
                      className={fieldClass}
                      inputMode="url"
                      value={draft.linkedinUrl}
                      placeholder="https://www.linkedin.com/in/…"
                      onChange={(event) =>
                        wizard.setField("linkedinUrl", event.target.value)
                      }
                    />
                  </label>
                  <p className="text-[12.5px] text-[#858c96]">{t("cvLater")}</p>
                </div>
              ) : null}
              {step === PeerMentorWizardStep.Availability ? (
                <WeeklyAvailabilityEditor
                  editor={wizard.availability}
                  showUnavailableDates={false}
                />
              ) : null}
              {step === PeerMentorWizardStep.Preview ? (
                <Preview wizard={wizard} />
              ) : null}
              {wizard.error ? (
                <p role="alert" className="text-sm text-[#d9464b]">
                  {wizard.error}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-3">
                {step > PeerMentorWizardStep.Categories ? (
                  <button
                    type="button"
                    className={buttonClass}
                    onClick={wizard.back}
                  >
                    {t("back")}
                  </button>
                ) : null}
                <button
                  type="submit"
                  className={primaryButtonClass}
                  disabled={wizard.isPublishing}
                >
                  {wizard.isPublishing
                    ? t("publishing")
                    : last
                      ? t("publish")
                      : t("next")}
                </button>
                <Link className={buttonClass} href={PEER_MENTOR_GIVE_HREF}>
                  {t("cancel")}
                </Link>
              </div>
            </fieldset>
          </form>
        </Panel>
      )}
    </div>
  );
}

function TextArea({
  label,
  hint,
  value,
  maxLength = 2000,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  maxLength?: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span>{label}</span>
      {hint ? (
        <span className="block text-[12px] text-[#858c96]">{hint}</span>
      ) : null}
      <textarea
        className={`${fieldClass} min-h-28`}
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

/** The card other students will see, built from the answers, and the hours chosen. */
function Preview({
  wizard,
}: {
  wizard: ReturnType<typeof usePeerMentorWizard>;
}) {
  const t = useTranslations("odtuWorkspaces.student.peerMentoring.wizard");
  const session = useAppSession();
  const institution = useInstitutionRecord();
  const badges = useMyBadges();
  const settings = wizard.availabilitySettings;
  return (
    <div className="space-y-4">
      <p className="text-[13px] text-[#676e78]">{t("previewNote")}</p>
      <PeerMentorCardView
        mentor={{
          mentorId: session?.userId ?? "preview",
          fullName: session?.fullName ?? "",
          department: institution.data?.departmentName ?? null,
          classYear: institution.data?.classYear ?? null,
          categories: wizard.draft.topics,
          helpWith: wizard.draft.helpWith.trim(),
          recommendationReasons: [],
          capacityFull: false,
          badges: (badges.data ?? [])
            .filter((award) => award.status === BadgeStatus.Active)
            .map(({ code, kind, programId, awardedAt }) => ({
              code,
              kind,
              programId,
              awardedAt,
            })),
        }}
      />
      <p className="text-[13px] text-[#4a5059]">
        {t("previewHours", {
          ranges: settings.rules.length,
          capacity: settings.menteeCapacity ?? "—",
          minutes: settings.defaultMeetingDurationMinutes,
        })}
      </p>
    </div>
  );
}
