import { notFound } from "next/navigation";
import { connection } from "next/server";
import "server-only";

import type { Edition } from "@/interfaces/edition";
import { parseEdition } from "@/lib/edition";

/** The deployment's edition (APP_EDITION, server-side only). */
export function appEdition(): Edition {
  return parseEdition(process.env.APP_EDITION);
}

/** Read per request: without connection() the layout is prerendered and the edition frozen at build. */
export async function requireEdition(edition: Edition) {
  await connection();
  if (appEdition() !== edition) notFound();
}
