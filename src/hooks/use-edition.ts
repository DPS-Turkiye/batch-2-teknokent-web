"use client";

import { useAppSession } from "@/components/providers/session-provider";
import { Edition } from "@/interfaces/edition";

/**
 * The edition of the deployment the signed-in user is on. A session cookie from before editions (or no session)
 * reads as Teknokent, the same default `workspacesOf` uses.
 */
export function useEdition(): Edition {
  return useAppSession()?.edition ?? Edition.Teknokent;
}
