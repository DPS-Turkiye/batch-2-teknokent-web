"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useToast } from "@/components/providers/toast-provider";
import { coordinatorProgramQueryKey } from "@/hooks/use-coordinator-program";
import type { MentorPoolRow } from "@/interfaces/mentor-pool";
import {
  cancelMentorInvite,
  decideProgramMentor,
  getMentorPool,
  getMentorReview,
  inviteProgramMentor,
  renewMentorInvite,
  withdrawProgramMentorInvite,
} from "@/lib/client/coordinator-programs";
import {
  CapacityFilter,
  expertiseOptions,
  filterPool,
  mentorInviteLink,
  PoolFilter,
  poolFilterOptions,
} from "@/lib/mentor-pool";
import { errorMessage, isEmailAddress } from "@/lib/utils";

export const mentorPoolQueryKey = (programId: string) =>
  [...coordinatorProgramQueryKey(programId), "mentors"] as const;

async function copyInviteLink(code: string) {
  await navigator.clipboard.writeText(
    mentorInviteLink(code, window.location.origin),
  );
}

/** Mentor Havuzu: the pool with its filters, inviting, and the invites still waiting. */
export function useMentorPool(programId: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const query = useQuery({
    queryKey: mentorPoolQueryKey(programId),
    queryFn: () => getMentorPool(programId),
  });
  const [filter, setFilter] = useState(PoolFilter.All);
  const [search, setSearch] = useState("");
  const [expertise, setExpertise] = useState("");
  const [capacity, setCapacity] = useState(CapacityFilter.All);
  const [inviting, setInviting] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);

  const saved = (rows: MentorPoolRow[]) => {
    queryClient.setQueryData(mentorPoolQueryKey(programId), rows);
    void queryClient.invalidateQueries({
      queryKey: coordinatorProgramQueryKey(programId),
      exact: true,
    });
  };
  const onError = (fallback: string) => (failure: Error) =>
    showToast({ message: errorMessage(failure, fallback), tone: "error" });

  const invite = useMutation({
    mutationFn: (value: string) => inviteProgramMentor(programId, value),
    onSuccess: async (rows, value) => {
      saved(rows);
      setInviting(false);
      setEmail("");
      const link = rows.find(
        (row) => row.inviteCode && row.email === value.trim().toLowerCase(),
      );
      if (link?.inviteCode) {
        await copyInviteLink(link.inviteCode);
        showToast({
          message: `Davet bağlantısı kopyalandı. ${value.trim()} ile paylaşın; 7 gün geçerli.`,
          tone: "success",
        });
      } else {
        showToast({
          message: "Davet gönderildi. Mentor kabul edince havuza eklenir.",
          tone: "success",
        });
      }
    },
    onError: (failure) =>
      setInviteError(errorMessage(failure, "Mentor davet edilemedi.")),
  });
  const renew = useMutation({
    mutationFn: (row: MentorPoolRow) =>
      renewMentorInvite(programId, row.inviteId as string),
    onSuccess: async (rows, row) => {
      saved(rows);
      await copyInviteLink(row.inviteCode as string);
      showToast({
        message: "Bağlantı 7 gün daha geçerli ve yeniden kopyalandı.",
        tone: "success",
      });
    },
    onError: onError("Davet yenilenemedi."),
  });
  const takeBack = useMutation({
    mutationFn: (row: MentorPoolRow) =>
      row.inviteId
        ? cancelMentorInvite(programId, row.inviteId)
        : withdrawProgramMentorInvite(programId, row.mentorId as string),
    onSuccess: (rows) => {
      saved(rows);
      showToast({ message: "Davet geri alındı.", tone: "success" });
    },
    onError: onError("Davet geri alınamadı."),
  });

  const rows = query.data ?? [];
  return {
    query,
    rows,
    visible: filterPool(rows, { filter, search, expertise, capacity }),
    filter,
    setFilter,
    filterOptions: poolFilterOptions(rows),
    search,
    setSearch,
    expertise,
    setExpertise,
    expertiseOptions: expertiseOptions(rows),
    capacity,
    setCapacity,
    inviting,
    openInvite: () => {
      setInviteError(null);
      setInviting(true);
    },
    closeInvite: () => {
      setInviting(false);
      setEmail("");
      setInviteError(null);
    },
    email,
    setEmail: (value: string) => {
      setInviteError(null);
      setEmail(value);
    },
    inviteError,
    sendInvite: () => {
      if (!isEmailAddress(email)) {
        setInviteError("Geçerli bir e-posta adresi girin.");
        return;
      }
      invite.mutate(email);
    },
    sending: invite.isPending,
    copyLink: async (row: MentorPoolRow) => {
      if (!row.inviteCode) return;
      await copyInviteLink(row.inviteCode);
      showToast({ message: "Davet bağlantısı kopyalandı.", tone: "success" });
    },
    renew: (row: MentorPoolRow) => renew.mutate(row),
    takeBack: (row: MentorPoolRow) => takeBack.mutate(row),
    busy: renew.isPending || takeBack.isPending,
    reviewing,
    openReview: (mentorId: string) => setReviewing(mentorId),
    closeReview: () => setReviewing(null),
    saved,
  };
}

/** The "Uzmanlık doğrulama" pop-up and its three decisions. */
export function useMentorReview(
  programId: string,
  mentorId: string,
  onDone: (rows: MentorPoolRow[]) => void,
) {
  const { showToast } = useToast();
  const [expertiseConfirmed, setExpertiseConfirmed] = useState(false);
  const query = useQuery({
    queryKey: [...mentorPoolQueryKey(programId), "review", mentorId],
    queryFn: () => getMentorReview(programId, mentorId),
  });
  const decide = useMutation({
    mutationFn: (accepted: boolean) =>
      decideProgramMentor(programId, mentorId, accepted),
    onSuccess: (rows, accepted) => {
      onDone(rows);
      const name = query.data?.fullName ?? "Mentor";
      showToast({
        message: accepted ? `${name} havuza eklendi.` : `${name} reddedildi.`,
        tone: "success",
      });
    },
    onError: (failure) =>
      showToast({
        message: errorMessage(failure, "Karar kaydedilemedi."),
        tone: "error",
      }),
  });
  const review = query.data;
  return {
    query,
    review,
    expertiseConfirmed,
    setExpertiseConfirmed,
    approve: () => decide.mutate(true),
    reject: () => decide.mutate(false),
    deciding: decide.isPending,
    moreInfoHref: review
      ? `mailto:${review.email}?${new URLSearchParams({
          subject: "Mentor başvurunuz hakkında",
        })}`
      : null,
  };
}
