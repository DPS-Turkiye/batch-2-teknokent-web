"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { useAppSession } from "@/components/providers/session-provider";
import { useToast } from "@/components/providers/toast-provider";
import {
  ORGANIZATION_MEMBERS_QUERY_KEY,
  useAddOrganizationMember,
  useOrganizationMembers,
} from "@/hooks/use-organization-members";
import type { OrganizationMember } from "@/interfaces/organization-member";
import {
  removeOrganizationMember,
  updateOrganizationMember,
} from "@/lib/client/organization-members";
import {
  foundersFirst,
  type MemberDraft,
  memberDraftError,
  MemberFormMode,
} from "@/lib/startup-team";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

/** The Ekip tab: the member list, adding, editing and removing members. */
export function useStartupTeam() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const session = useAppSession();
  const membersQuery = useOrganizationMembers();
  const add = useAddOrganizationMember();
  const [draft, setDraft] = useState<MemberDraft | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const members = useMemo(
    () => foundersFirst(membersQuery.data ?? []),
    [membersQuery.data],
  );
  const viewerIsFounder = members.some(
    (member) => member.founder && member.id === session?.userId,
  );

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

  const remove = useMutation({
    mutationFn: removeOrganizationMember,
    onSuccess: () => {
      setRemovingId(null);
      void refresh();
      showToast({ message: "Ekip üyesi çıkarıldı.", tone: "success" });
    },
    onError: (error) =>
      showToast({
        message: errorMessage(error, "Ekip üyesi çıkarılamadı."),
        tone: "error",
      }),
  });

  const formError = draft && showErrors ? memberDraftError(draft) : null;

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
        showToast({ message: "Ekip üyesi eklendi.", tone: "success" });
      } else if (draft.memberId) {
        await update.mutateAsync({
          memberId: draft.memberId,
          fullName,
          jobTitle,
        });
        showToast({ message: "Ekip üyesi güncellendi.", tone: "success" });
      }
      setDraft(null);
    } catch (error) {
      showToast({
        message: errorMessage(error, "Ekip üyesi kaydedilemedi."),
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
  };
}
