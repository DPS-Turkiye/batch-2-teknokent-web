"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addProgramStartup,
  createProgram,
  decideProgramInvitation,
  decideProgramMentorRequest,
  getProgramDirectory,
  getProgramInvitations,
  getPrograms,
  inviteProgramMentor,
  removeProgramStartup,
  requestProgramMembership,
} from "@/lib/client/programs";

export const PROGRAMS_QUERY_KEY = ["programs"] as const;
export const PROGRAM_DIRECTORY_QUERY_KEY = ["program-directory"] as const;
export const PROGRAM_INVITATIONS_QUERY_KEY = ["program-invitations"] as const;

export function usePrograms() {
  return useQuery({
    queryKey: PROGRAMS_QUERY_KEY,
    queryFn: getPrograms,
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
