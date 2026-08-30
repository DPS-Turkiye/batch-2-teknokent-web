"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getInviteCode,
  rotateInviteCode,
} from "@/lib/client/organization-invite";

export const ORGANIZATION_INVITE_QUERY_KEY = ["organization-invite"] as const;

export function useOrganizationInvite() {
  return useQuery({
    queryKey: ORGANIZATION_INVITE_QUERY_KEY,
    queryFn: getInviteCode,
  });
}

export function useRotateInviteCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rotateInviteCode,
    onSuccess: (invite) =>
      queryClient.setQueryData(ORGANIZATION_INVITE_QUERY_KEY, invite),
  });
}
