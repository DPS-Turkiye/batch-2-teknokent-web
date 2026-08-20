"use client";

import { useQuery } from "@tanstack/react-query";

import type { BackendUser } from "@/interfaces/session";
import { httpClient } from "@/lib/http-client";

async function fetchDemoAccounts(
  role: "MENTEE" | "MENTOR",
): Promise<BackendUser[]> {
  const response = await httpClient.get<BackendUser[]>("/api/demo-accounts", {
    params: { role },
  });
  if (response.status !== 200 || !Array.isArray(response.data)) {
    throw new Error("Demo accounts could not be loaded.");
  }
  return response.data;
}

export function useDemoAccounts(role: "MENTEE" | "MENTOR" = "MENTEE") {
  return useQuery({
    queryKey: ["demo-accounts", role],
    queryFn: () => fetchDemoAccounts(role),
    staleTime: 10 * 60 * 1000,
  });
}
