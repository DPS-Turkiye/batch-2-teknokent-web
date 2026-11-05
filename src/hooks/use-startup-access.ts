"use client";

import { useQuery } from "@tanstack/react-query";

import { useSession } from "@/components/providers/session-provider";
import { STARTUP_PROFILE_QUERY_KEY } from "@/hooks/use-startup-profile";
import { UserRole } from "@/interfaces/session";
import { getStartupProfile } from "@/lib/client/organization";
import { StartupAccess, startupAccessOf } from "@/lib/startup-access";

/** Whether the signed-in mentee has a startup, and whether it is approved. Other roles are always Ready. */
export function useStartupAccess() {
  const { session } = useSession();
  const mentee = session?.role === UserRole.Mentee;
  const organizationId = session?.organizationId;
  const profile = useQuery({
    queryKey: STARTUP_PROFILE_QUERY_KEY,
    queryFn: getStartupProfile,
    enabled: mentee && Boolean(organizationId),
  });
  if (!mentee) return { access: StartupAccess.Ready, isLoading: false };
  return {
    access: startupAccessOf(organizationId, profile.data?.approvalStatus),
    isLoading: Boolean(organizationId) && profile.isLoading,
  };
}
