"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useToast } from "@/components/providers/toast-provider";
import { coordinatorProgramQueryKey } from "@/hooks/use-coordinator-program";
import { COORDINATOR_PROGRAMS_QUERY_KEY } from "@/hooks/use-coordinator-programs";
import type { MatchCandidate } from "@/interfaces/program-matching";
import {
  createMatch,
  getMatching,
  getMatchSuggestions,
} from "@/lib/client/coordinator-programs";
import { addCoordinatorNote } from "@/lib/client/coordinator-notes";
import { proposeMeeting } from "@/lib/client/meeting-proposals";
import { defaultProposalStart } from "@/lib/meeting-proposals";
import {
  filterPool,
  findMatch,
  type FirstSteps,
  INTRO_AGENDA,
  INTRO_MEETING_MINUTES,
  MatchTab,
} from "@/lib/program-matching";
import { errorMessage, toDateTimeLocalValue } from "@/lib/utils";

export const matchingQueryKey = (programId: string) =>
  [...coordinatorProgramQueryKey(programId), "matching"] as const;

/**
 * Eşleşmeler: pick a waiting team, look at the pool mentors ranked for it (or search the pool by hand), and
 * confirm a match, optionally proposing the first meeting and leaving a coordinator note. The team from the
 * Anasayfa link starts selected; a confirmed match opens its "İlk adımlar" drawer.
 */
export function useProgramMatching(programId: string, initialTeamId?: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [tab, setTab] = useState(MatchTab.Waiting);
  const [pickedTeamId, setPickedTeamId] = useState(initialTeamId ?? null);
  const [search, setSearch] = useState("");
  const [confirming, setConfirming] = useState<MatchCandidate | null>(null);
  const [matched, setMatched] = useState<{
    team: string;
    mentor: string;
  } | null>(null);
  const [introOn, setIntroOn] = useState(false);
  const [introAt, setIntroAt] = useState(() =>
    toDateTimeLocalValue(defaultProposalStart()),
  );
  const [noteOn, setNoteOn] = useState(false);
  const [note, setNote] = useState("");
  const [firstSteps, setFirstSteps] = useState<FirstSteps | null>(null);
  const [firstStepsOpen, setFirstStepsOpen] = useState(false);

  const overview = useQuery({
    queryKey: matchingQueryKey(programId),
    queryFn: () => getMatching(programId),
  });
  const waiting = overview.data?.waiting ?? [];
  const team =
    waiting.find((item) => item.organizationId === pickedTeamId) ?? waiting[0];

  const suggestions = useQuery({
    queryKey: [...matchingQueryKey(programId), team?.organizationId],
    queryFn: () => getMatchSuggestions(programId, team!.organizationId),
    enabled: Boolean(team),
  });

  const match = useMutation({
    mutationFn: async (candidate: MatchCandidate) => {
      const next = await createMatch(programId, {
        organizationId: team!.organizationId,
        mentorId: candidate.mentorId,
      });
      const created = findMatch(next, team!.organizationId, candidate.mentorId);
      const trimmedNote = note.trim();
      const followUps = created
        ? await Promise.allSettled([
            introOn
              ? proposeMeeting(created.mentorshipId, {
                  scheduledAt: new Date(introAt).toISOString(),
                  durationMinutes: INTRO_MEETING_MINUTES,
                  agenda: INTRO_AGENDA,
                  replacesMeetingId: null,
                })
              : Promise.resolve(null),
            noteOn && trimmedNote
              ? addCoordinatorNote(created.mentorshipId, trimmedNote)
              : Promise.resolve(null),
          ])
        : [];
      return {
        next,
        mentorshipId: created?.mentorshipId ?? null,
        proposalFailed: followUps[0]?.status === "rejected",
        noteFailed: followUps[1]?.status === "rejected",
      };
    },
    onSuccess: (
      { next, mentorshipId, proposalFailed, noteFailed },
      candidate,
    ) => {
      queryClient.setQueryData(matchingQueryKey(programId), next);
      if (mentorshipId) {
        setFirstSteps({
          mentorshipId,
          teamName: team!.name,
          leadName: team!.leadName,
          mentorId: candidate.mentorId,
          mentorName: candidate.fullName,
          mentorLoad: `${candidate.activeTeams + 1}/${candidate.capacity} yük`,
          matchedAt: new Date().toISOString(),
        });
        setFirstStepsOpen(true);
      }
      setIntroOn(false);
      setNoteOn(false);
      setNote("");
      if (proposalFailed || noteFailed) {
        const failedSteps = [
          proposalFailed ? "tanışma önerisi" : null,
          noteFailed ? "koordinatör notu" : null,
        ]
          .filter(Boolean)
          .join(" ve ");
        showToast({
          message: `Eşleşme oluşturuldu, ancak ${failedSteps} kaydedilemedi.${
            proposalFailed
              ? " İlk adımlar bölümünden görüşmeyi yeniden önerebilirsiniz."
              : ""
          }`,
          tone: "error",
        });
      } else {
        showToast({
          message: `${team!.name} ↔ ${candidate.fullName} eşleşti. İki tarafa bildirim gönderildi.`,
          tone: "success",
        });
      }
      void queryClient.invalidateQueries({
        queryKey: coordinatorProgramQueryKey(programId),
        exact: true,
      });
      void queryClient.invalidateQueries({
        queryKey: COORDINATOR_PROGRAMS_QUERY_KEY,
      });
      setMatched({ team: team!.name, mentor: candidate.fullName });
      setConfirming(null);
      setSearch("");
      setPickedTeamId(null);
    },
    onError: (failure) =>
      showToast({
        message: errorMessage(failure, "Eşleşme oluşturulamadı."),
        tone: "error",
      }),
  });

  return {
    overview,
    tab,
    setTab,
    waiting,
    team,
    pickTeam: (organizationId: string) => {
      setPickedTeamId(organizationId);
      setSearch("");
      setMatched(null);
    },
    suggestions,
    search,
    setSearch,
    searchResults: filterPool(suggestions.data?.pool ?? [], search),
    confirming,
    openConfirm: (candidate: MatchCandidate) => setConfirming(candidate),
    closeConfirm: () => setConfirming(null),
    confirm: () => confirming && match.mutate(confirming),
    matching: match.isPending,
    matched,
    introOn,
    setIntroOn,
    introAt,
    setIntroAt,
    noteOn,
    setNoteOn,
    note,
    setNote,
    firstSteps: firstStepsOpen ? firstSteps : null,
    hasFirstSteps: Boolean(firstSteps),
    openFirstSteps: () => setFirstStepsOpen(true),
    closeFirstSteps: () => setFirstStepsOpen(false),
  };
}
