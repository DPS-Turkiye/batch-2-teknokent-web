"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  listAdminInterventions,
  openAdminIntervention,
  resolveAdminIntervention,
} from "@/lib/client/admin-interventions";

export const ADMIN_INTERVENTIONS_QUERY_KEY = ["admin-interventions"] as const;

export function useAdminInterventions() {
  return useQuery({
    queryKey: ADMIN_INTERVENTIONS_QUERY_KEY,
    queryFn: listAdminInterventions,
  });
}

export function useOpenIntervention() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: openAdminIntervention,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ADMIN_INTERVENTIONS_QUERY_KEY,
      }),
  });
}

export function useResolveIntervention() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resolveAdminIntervention,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ADMIN_INTERVENTIONS_QUERY_KEY,
      }),
  });
}
