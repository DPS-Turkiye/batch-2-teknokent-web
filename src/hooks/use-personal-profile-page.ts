"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { useAppSession } from "@/components/providers/session-provider";
import { useToast } from "@/components/providers/toast-provider";
import { useIndividualProgram } from "@/hooks/use-individual-program";
import { useOpenActionCounts } from "@/hooks/use-open-action-counts";
import { useOrganizationMembers } from "@/hooks/use-organization-members";
import { usePasswordReset } from "@/hooks/use-password-reset";
import { usePersonalProfile } from "@/hooks/use-personal-profile";
import { useOptionLabel } from "@/hooks/use-option-label";
import { useProfilePhoto } from "@/hooks/use-profile-photo";
import { useStartupHeader } from "@/hooks/use-startup-header";
import { useStartupOverview } from "@/hooks/use-startup-overview";
import { requestStatusHref } from "@/lib/mentee-home";
import {
  type ProfileChip,
  ProfileChipTone,
  mentorshipRowStatus,
  mentorshipSessionLabel,
  personalRoleLabel,
  personalSubtitle,
  startupSummary,
} from "@/lib/personal-profile";
import { initials } from "@/lib/utils";

/** Everything the mentee's personal profile page shows and does. */
export function usePersonalProfilePage() {
  const t = useTranslations("personalProfile");
  const texts = { t, locale: useLocale() };
  const optionLabel = useOptionLabel();
  const session = useAppSession();
  const { showToast } = useToast();
  const profile = usePersonalProfile();
  const photo = useProfilePhoto();
  const header = useStartupHeader();
  const overview = useStartupOverview();
  const membersQuery = useOrganizationMembers();
  // A student's team of one is not a startup: no founder label, funding chip or startup card.
  const { individual } = useIndividualProgram();
  const openActions = useOpenActionCounts(
    overview.mentorships.map((row) => row.id),
  );
  const [editing, setEditing] = useState(false);
  const { isSendingReset, sendPasswordReset } = usePasswordReset();

  const fullName = profile.draft?.fullName ?? session?.fullName ?? "";
  const isFounder =
    !individual &&
    (membersQuery.data ?? []).some(
      (member) => member.founder && member.id === session?.userId,
    );
  const role = personalRoleLabel(profile.draft?.jobTitle, isFounder, texts);
  const chips = [
    header.programName
      ? { label: header.programName, tone: ProfileChipTone.Program }
      : null,
    overview.mentorships.length > 0
      ? { label: t("inMentorship"), tone: ProfileChipTone.Active }
      : null,
    header.fundingStage && !individual
      ? {
          label: optionLabel("fundingStage", header.fundingStage),
          tone: ProfileChipTone.Neutral,
        }
      : null,
  ].filter((chip): chip is ProfileChip => chip !== null);

  // A successful save flips `saved`, which ends edit mode without an effect.
  const startEditing = () => {
    profile.discard();
    setEditing(true);
  };
  const cancelEditing = () => {
    profile.discard();
    setEditing(false);
  };

  return {
    isLoading: profile.isLoading,
    loadError: profile.loadError,
    fullName,
    initials: initials(fullName),
    email: session?.email ?? "",
    role,
    subtitle: personalSubtitle(
      role,
      individual ? null : session?.organizationName,
    ),
    chips,
    photo,
    draft: profile.draft,
    setField: profile.setField,
    fieldErrors: profile.fieldErrors,
    canSave: profile.canSave,
    isSaving: profile.isSaving,
    saveError: profile.saveError,
    isEditing: editing && !profile.saved,
    startEditing,
    cancelEditing,
    save: profile.save,
    cvWhoSees: t(individual ? "cvWhoSeesStudent" : "cvWhoSees"),
    startup:
      session?.organizationId && !individual
        ? {
            name: header.name ?? session.organizationName ?? "",
            initials: header.initials,
            logoUrl: header.logoUrl,
            summary: startupSummary(
              {
                fundingStage:
                  header.fundingStage &&
                  optionLabel("fundingStage", header.fundingStage),
                teamSize: overview.teamSize,
                maturity: overview.profile?.maturity
                  ? optionLabel("stage", overview.profile.maturity)
                  : null,
              },
              texts,
            ),
          }
        : null,
    mentorships: overview.mentorships.map((row) => ({
      id: row.id,
      mentorName: row.mentorName,
      initials: initials(row.mentorName),
      detail: mentorshipSessionLabel(row, texts),
      status: mentorshipRowStatus(row, openActions[row.id] ?? 0, texts),
      href: requestStatusHref(row.id),
    })),
    mentorshipsLoading: overview.mentorshipsLoading,
    isSendingReset,
    sendPasswordReset,
    showComingSoon: () => showToast({ message: t("comingSoon"), tone: "info" }),
  };
}
