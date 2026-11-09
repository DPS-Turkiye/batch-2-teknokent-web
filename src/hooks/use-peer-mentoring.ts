"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useMemo, useState } from "react";

import { useToast } from "@/components/providers/toast-provider";
import { AppointmentSide } from "@/interfaces/appointment";
import type {
  CreatePeerMentoringRequestInput,
  PeerMentorCard,
  PeerTopicCategory,
} from "@/interfaces/peer-mentoring";
import {
  createPeerMentoringRequest,
  getPeerMentoringRequests,
  getPeerMentors,
} from "@/lib/client/peer-mentoring";
import {
  OPEN_PEER_REQUEST_STATUSES,
  PEER_MENTORING_SIDE_PARAM,
  PEER_REQUEST_MESSAGE_MAX,
  PEER_REQUEST_MESSAGE_MIN,
  peerMentoringSide,
} from "@/lib/peer-mentoring";
import { getProfileCompletionCategories } from "@/lib/client/student-profile-completion";
import { PROFILE_COMPLETION_CATEGORIES_QUERY_KEY } from "@/hooks/use-student-profile-completion";
import { errorMessage } from "@/lib/utils";

export const PEER_MENTORS_QUERY_KEY = ["peer-mentors"] as const;
export const PEER_MENTORING_REQUESTS_QUERY_KEY = [
  "peer-mentoring",
  "requests",
] as const;

/** Mentorluk Al | Mentorluk Ver, kept in the URL so a link can open either side. */
export function usePeerMentoringSide() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const side = peerMentoringSide(params.get(PEER_MENTORING_SIDE_PARAM));

  const setSide = (next: AppointmentSide) => {
    const query = new URLSearchParams(params.toString());
    if (next === AppointmentSide.Mentor) {
      query.set(PEER_MENTORING_SIDE_PARAM, next);
    } else {
      query.delete(PEER_MENTORING_SIDE_PARAM);
    }
    const search = query.toString();
    router.replace(search ? `${pathname}?${search}` : pathname, {
      scroll: false,
    });
  };

  return { side, setSide };
}

export function usePeerMentoringRequests() {
  return useQuery({
    queryKey: PEER_MENTORING_REQUESTS_QUERY_KEY,
    queryFn: getPeerMentoringRequests,
  });
}

/** Mentorluk Al: the peer mentor list with its category and text filters. */
export function usePeerMentorDirectory() {
  const [category, setCategory] = useState<PeerTopicCategory | null>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());
  const mentors = useQuery({
    queryKey: [...PEER_MENTORS_QUERY_KEY, category, deferredQuery],
    queryFn: () => getPeerMentors({ category, query: deferredQuery }),
  });
  const catalogue = useQuery({
    queryKey: PROFILE_COMPLETION_CATEGORIES_QUERY_KEY,
    queryFn: getProfileCompletionCategories,
  });
  const requests = usePeerMentoringRequests();
  const openRequestMentorIds = useMemo(
    () =>
      new Set(
        (requests.data ?? [])
          .filter((request) =>
            OPEN_PEER_REQUEST_STATUSES.includes(request.status),
          )
          .map((request) => request.mentor.userId),
      ),
    [requests.data],
  );

  return {
    category,
    setCategory,
    /** Only the program's active categories can be picked. */
    categories: (catalogue.data ?? []).map((item) => item.id),
    noActiveCategories: catalogue.isSuccess && catalogue.data.length === 0,
    query,
    setQuery,
    mentors,
    filtered: category != null || deferredQuery !== "",
    hasOpenRequest: (mentorId: string) => openRequestMentorIds.has(mentorId),
  };
}

/** The "Talep gönder" dialog: one of the mentor's categories and a short message. */
export function usePeerMentorRequestForm(
  mentor: PeerMentorCard,
  onSent: () => void,
) {
  const t = useTranslations("odtuWorkspaces.student.peerMentoring.dialog");
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<PeerTopicCategory>(
    mentor.categories[0],
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const send = useMutation({
    mutationFn: (input: CreatePeerMentoringRequestInput) =>
      createPeerMentoringRequest(input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: PEER_MENTORING_REQUESTS_QUERY_KEY,
      }),
  });

  const changeMessage = (value: string) => {
    setError(null);
    setMessage(value);
  };

  const submit = async () => {
    const text = message.trim();
    if (text.length < PEER_REQUEST_MESSAGE_MIN) {
      setError(t("messageTooShort", { min: PEER_REQUEST_MESSAGE_MIN }));
      return;
    }
    try {
      await send.mutateAsync({
        mentorId: mentor.mentorId,
        category,
        message: text,
      });
      showToast({ message: t("sent"), tone: "success" });
      onSent();
    } catch (sendError) {
      setError(errorMessage(sendError, t("failed")));
    }
  };

  return {
    category,
    setCategory,
    message,
    setMessage: changeMessage,
    maxLength: PEER_REQUEST_MESSAGE_MAX,
    error,
    isSending: send.isPending,
    submit,
  };
}
