"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addProgramStartup,
  createProgram,
  decideProgramInvitation,
  decideProgramMentorRequest,
  getOrganizationPrograms,
  getProgramNames,
  getProgramDetail,
  getProgramDirectory,
  getProgramInvitations,
  getPrograms,
  inviteProgramMentor,
  removeProgramStartup,
  requestProgramMembership,
  setActiveProgram,
  setProgramStatus,
} from "@/lib/client/programs";
import { useToast } from "@/components/providers/toast-provider";
import {
  PROGRAM_STATUS_LABELS,
  type Program,
  ProgramStatus,
} from "@/interfaces/program";
import { PROGRAM_DETAIL_QUERY_KEY } from "@/lib/const/programs";

export const PROGRAMS_QUERY_KEY = ["programs"] as const;
export const PROGRAM_DIRECTORY_QUERY_KEY = ["program-directory"] as const;
export const PROGRAM_INVITATIONS_QUERY_KEY = ["program-invitations"] as const;
export const PROGRAM_NAMES_QUERY_KEY = ["program-names"] as const;
export const ORGANIZATION_PROGRAMS_QUERY_KEY = [
  "organization-programs",
] as const;

export function useProgramNames() {
  return useQuery({
    queryKey: PROGRAM_NAMES_QUERY_KEY,
    queryFn: getProgramNames,
  });
}

export function useOrganizationPrograms({ enabled = true } = {}) {
  return useQuery({
    queryKey: ORGANIZATION_PROGRAMS_QUERY_KEY,
    queryFn: getOrganizationPrograms,
    enabled,
  });
}

export function useSetActiveProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setActiveProgram,
    onSuccess: (data) =>
      queryClient.setQueryData(ORGANIZATION_PROGRAMS_QUERY_KEY, data),
  });
}

export function usePrograms({ enabled = true } = {}) {
  return useQuery({
    queryKey: PROGRAMS_QUERY_KEY,
    queryFn: getPrograms,
    enabled,
  });
}

export function useProgramDetail(programId: string | null) {
  return useQuery({
    queryKey: [PROGRAM_DETAIL_QUERY_KEY, programId],
    queryFn: () => getProgramDetail(programId as string),
    enabled: Boolean(programId),
  });
}

export function useProgramDirectory() {
  return useQuery({
    queryKey: PROGRAM_DIRECTORY_QUERY_KEY,
    queryFn: getProgramDirectory,
  });
}

export function useProgramInvitations() {
  return useQuery({
    queryKey: PROGRAM_INVITATIONS_QUERY_KEY,
    queryFn: getProgramInvitations,
  });
}

export function useCreateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProgram,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEY }),
  });
}

export function useSetProgramStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      programId,
      status,
    }: {
      programId: string;
      status: ProgramStatus;
    }) => setProgramStatus(programId, status),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEY }),
  });
}

/** The coordinator's Aktif / Tamamlandı switch on one program. */
export function useProgramStatusSwitch(program: Program) {
  const { showToast } = useToast();
  const setStatus = useSetProgramStatus();
  const active = program.status !== ProgramStatus.Completed;

  const toggle = async () => {
    const status = active ? ProgramStatus.Completed : ProgramStatus.Active;
    try {
      await setStatus.mutateAsync({ programId: program.id, status });
      showToast({
        message: `${program.name}: ${PROGRAM_STATUS_LABELS[status]}`,
        tone: "success",
      });
    } catch (reason) {
      showToast({
        message:
          reason instanceof Error
            ? reason.message
            : "Program durumu güncellenemedi.",
        tone: "error",
      });
    }
  };

  return {
    active,
    label:
      PROGRAM_STATUS_LABELS[
        active ? ProgramStatus.Active : ProgramStatus.Completed
      ],
    isSaving: setStatus.isPending,
    toggle,
  };
}

export function useAddProgramStartup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      programId,
      organizationId,
    }: {
      programId: string;
      organizationId: string;
    }) => addProgramStartup(programId, organizationId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEY }),
  });
}

export function useRemoveProgramStartup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      programId,
      organizationId,
    }: {
      programId: string;
      organizationId: string;
    }) => removeProgramStartup(programId, organizationId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEY }),
  });
}

export function useInviteProgramMentor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      programId,
      mentorId,
    }: {
      programId: string;
      mentorId: string;
    }) => inviteProgramMentor(programId, mentorId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEY }),
  });
}

export function useRequestProgramMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requestProgramMembership,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEY }),
  });
}

export function useDecideProgramMentorRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      programId,
      mentorId,
      accepted,
    }: {
      programId: string;
      mentorId: string;
      accepted: boolean;
    }) => decideProgramMentorRequest(programId, mentorId, accepted),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEY }),
  });
}

export function useDecideProgramInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      programId,
      accepted,
    }: {
      programId: string;
      accepted: boolean;
    }) => decideProgramInvitation(programId, accepted),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PROGRAM_INVITATIONS_QUERY_KEY,
      });
      void queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEY });
    },
  });
}
