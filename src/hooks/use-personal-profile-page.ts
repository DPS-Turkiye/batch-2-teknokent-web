"use client";

import { useState } from "react";

import { useAppSession } from "@/components/providers/session-provider";
import { useToast } from "@/components/providers/toast-provider";
import { useOpenActionCounts } from "@/hooks/use-open-action-counts";
import { useOrganizationMembers } from "@/hooks/use-organization-members";
import { usePersonalProfile } from "@/hooks/use-personal-profile";
import { useProfilePhoto } from "@/hooks/use-profile-photo";
import { useStartupHeader } from "@/hooks/use-startup-header";
import { useStartupOverview } from "@/hooks/use-startup-overview";
import { requestPasswordReset } from "@/lib/firebase/auth";
import { requestStatusHref } from "@/lib/mentee-home";
import {
  COMING_SOON_MESSAGE,
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
  const session = useAppSession();
  const { showToast } = useToast();
  const profile = usePersonalProfile();
  const photo = useProfilePhoto();
  const header = useStartupHeader();
  const overview = useStartupOverview();
  const membersQuery = useOrganizationMembers();
  const openActions = useOpenActionCounts(
    overview.mentorships.map((row) => row.id),
  );
  const [editing, setEditing] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const fullName = profile.draft?.fullName ?? session?.fullName ?? "";
  const isFounder = (membersQuery.data ?? []).some(
    (member) => member.founder && member.id === session?.userId,
  );
  const role = personalRoleLabel(profile.draft?.jobTitle, isFounder);
  const chips = [
    header.programName
      ? { label: header.programName, tone: ProfileChipTone.Program }
      : null,
    overview.mentorships.length > 0
      ? { label: "Mentorluk alıyor", tone: ProfileChipTone.Active }
      : null,
    header.fundingStage
      ? { label: header.fundingStage, tone: ProfileChipTone.Neutral }
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

  const sendPasswordReset = async () => {
    if (!session?.email) return;
    setIsSendingReset(true);
    try {
      await requestPasswordReset(session.email);
      showToast({
        message: "Şifre sıfırlama bağlantısı e-postana gönderildi.",
        tone: "success",
      });
    } catch {
      showToast({
        message: "Şifre sıfırlama e-postası gönderilemedi.",
        tone: "error",
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  return {
    isLoading: profile.isLoading,
    loadError: profile.loadError,
    fullName,
    initials: initials(fullName),
    email: session?.email ?? "",
    role,
    subtitle: personalSubtitle(role, session?.organizationName),
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
    startup: session?.organizationId
      ? {
          name: header.name ?? session.organizationName ?? "",
          initials: header.initials,
          logoUrl: header.logoUrl,
          summary: startupSummary({
            fundingStage: header.fundingStage,
            teamSize: overview.teamSize,
            maturity: overview.profile?.maturity ?? null,
          }),
        }
      : null,
    mentorships: overview.mentorships.map((row) => ({
      id: row.id,
      mentorName: row.mentorName,
      initials: initials(row.mentorName),
      detail: mentorshipSessionLabel(row),
      status: mentorshipRowStatus(row, openActions[row.id] ?? 0),
      href: requestStatusHref(row.id),
    })),
    mentorshipsLoading: overview.mentorshipsLoading,
    isSendingReset,
    sendPasswordReset,
    showComingSoon: () =>
      showToast({ message: COMING_SOON_MESSAGE, tone: "info" }),
  };
}
