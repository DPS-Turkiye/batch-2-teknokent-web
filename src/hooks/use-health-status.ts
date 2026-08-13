"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchHealthClient, healthKeys, isHealthUp } from "@/lib/health";
import type { HealthResponse, UseHealthStatusResult } from "@/types/health";

export type { UseHealthStatusResult } from "@/types/health";

export function useHealthStatus(): UseHealthStatusResult {
  const query = useQuery({
    queryKey: healthKeys.status(),
    queryFn: fetchHealthClient,
    staleTime: 30_000,
  });

  const health = query.data;

  return {
    health,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isUp: health ? isHealthUp(health) : false,
    refetch: () => {
      void query.refetch();
    },
  };
}
