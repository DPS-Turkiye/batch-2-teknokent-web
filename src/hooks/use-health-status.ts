"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchHealthClient, healthKeys, isHealthUp } from "@/lib/health";
import type { HealthResponse } from "@/interfaces/health";

export interface UseHealthStatusResult {
  health: HealthResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isUp: boolean;
  refetch: () => void;
}

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
