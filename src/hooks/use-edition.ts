"use client";

import { useAppSession } from "@/components/providers/session-provider";
import type { Edition } from "@/interfaces/edition";
import { editionOf } from "@/lib/edition";

/** The edition of the deployment the signed-in user is on; see `editionOf`. */
export function useEdition(): Edition {
  return editionOf(useAppSession());
}
