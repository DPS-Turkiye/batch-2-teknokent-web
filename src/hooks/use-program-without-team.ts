"use client";
import { useQuery } from "@tanstack/react-query";
import { coordinatorProgramQueryKey } from "@/hooks/use-coordinator-program";
import { getProgramWithoutTeam } from "@/lib/client/coordinator-programs";
export function useProgramWithoutTeam(programId: string) {
  return useQuery({
    queryKey: [...coordinatorProgramQueryKey(programId), "without-team"],
    queryFn: () => getProgramWithoutTeam(programId),
  });
}
