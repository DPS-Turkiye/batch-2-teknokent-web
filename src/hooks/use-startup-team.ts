"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { useAppSession } from "@/components/providers/session-provider";
import { useToast } from "@/stores/toast-store";
import {
  ORGANIZATION_MEMBERS_QUERY_KEY,
  useAddOrganizationMember,
  useOrganizationMembers,
} from "@/hooks/use-organization-members";
import {
  TEAM_CHANGES_QUERY_KEY,
  useStartupInProgram,
} from "@/hooks/use-team-changes";
import type { OrganizationMember } from "@/interfaces/organization-member";
import {
  removeOrganizationMember,
  updateOrganizationMember,
} from "@/lib/client/organization-members";
import { requestRemoval } from "@/lib/client/team-changes";
import {
  foundersFirst,
  isFounder,
  type MemberDraft,
  memberDraftError,
  MemberFormMode,
} from "@/lib/startup-team";
import { errorMessage } from "@/lib/utils";

/** The Ekip tab: the member list, adding, editing and removing (or asking to remove) members. */
export function useStartupTeam() {
  const t = useTranslations("startupTeam");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const session = useAppSession();
  const membersQuery = useOrganizationMembers();
  const add = useAddOrganizationMember();
  const removalNeedsApproval = useStartupInProgram();
  const [draft, setDraft] = useState<MemberDraft | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const members = useMemo(
    () => foundersFirst(membersQuery.data ?? []),
    [membersQuery.data],
  );
  const viewerIsFounder = isFounder(members, session?.userId);

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ORGANIZATION_MEMBERS_QUERY_KEY });

  const update = useMutation({
    mutationFn: (variables: {
      memberId: string;
      fullName: string;
      jobTitle: string;
    }) =>
      updateOrganizationMember(variables.memberId, {
        fullName: variables.fullName,
        jobTitle: variables.jobTitle,
      }),
    onSuccess: () => void refresh(),
  });

  // Inside a program the coordinator decides; the member stays until then.
  const remove = useMutation({
    mutationFn: (memberId: string) =>
      removalNeedsApproval
        ? requestRemoval(memberId)
        : removeOrganizationMember(memberId),
    onSuccess: () => {
      setRemovingId(null);
      if (removalNeedsApproval) {
        void queryClient.invalidateQueries({
          queryKey: TEAM_CHANGES_QUERY_KEY,
        });
      } else {
        void refresh();
      }
      showToast({
        message: removalNeedsApproval ? t("removalRequested") : t("removed"),
        tone: "success",
      });
    },
    onError: (error) =>
      showToast({
        message: errorMessage(error, t("removeFailed")),
        tone: "error",
      }),
  });

  const draftError = draft && showErrors ? memberDraftError(draft) : null;
  const formError = draftError ? t(`errors.${draftError}`) : null;

  async function submitForm() {
    if (!draft) return;
    setShowErrors(true);
    if (memberDraftError(draft)) return;
    const fullName = draft.fullName.trim();
    const jobTitle = draft.jobTitle.trim();
    try {
      if (draft.mode === MemberFormMode.Add) {
        await add.mutateAsync({
          fullName,
          email: draft.email.trim(),
          jobTitle,
        });
        showToast({ message: t("added"), tone: "success" });
      } else if (draft.memberId) {
        await update.mutateAsync({
          memberId: draft.memberId,
          fullName,
          jobTitle,
        });
        showToast({ message: t("updated"), tone: "success" });
      }
      setDraft(null);
    } catch (error) {
      showToast({
        message: errorMessage(error, t("saveFailed")),
        tone: "error",
      });
    }
  }

  return {
    askRemove: setRemovingId,
    canEdit: (member: OrganizationMember) =>
      viewerIsFounder || member.id === session?.userId,
    // The backend refuses to remove the founder, and only lets the founder remove.
    canRemove: (member: OrganizationMember) =>
      viewerIsFounder && !member.founder,
    cancelRemove: () => setRemovingId(null),
    closeForm: () => setDraft(null),
    confirmRemove: () => {
      if (removingId) remove.mutate(removingId);
    },
    draft,
    error: membersQuery.error,
    formError,
    isLoading: membersQuery.isLoading,
    isRemoving: remove.isPending,
    isSaving: add.isPending || update.isPending,
    members,
    removalNeedsApproval,
    openAdd: () => {
      setShowErrors(false);
      setDraft({
        mode: MemberFormMode.Add,
        memberId: null,
        fullName: "",
        email: "",
        jobTitle: "",
      });
    },
    openEdit: (member: OrganizationMember) => {
      setShowErrors(false);
      setDraft({
        mode: MemberFormMode.Edit,
        memberId: member.id,
        fullName: member.fullName,
        email: member.email,
        jobTitle: member.jobTitle ?? "",
      });
    },
    removingMember: members.find((member) => member.id === removingId) ?? null,
    setField: (field: "fullName" | "email" | "jobTitle", value: string) =>
      setDraft((current) =>
        current ? { ...current, [field]: value } : current,
      ),
    submitForm,
    viewerIsFounder,
  };
}
