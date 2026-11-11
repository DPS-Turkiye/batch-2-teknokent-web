import { notFound } from "next/navigation";
import { connection } from "next/server";
import "server-only";

/**
 * The ODTÜ student and academician workspaces stay unreachable until this is "true". Unset
 * (as on the deployed app, whose build writes only the keys amplify.yml lists) they answer
 * like a route that does not exist.
 */
export function odtuWorkspacesEnabled() {
  return process.env.ODTU_WORKSPACES_ENABLED === "true";
}

/** Read per request: without connection() the layouts are prerendered and the flag frozen at build. */
export async function requireOdtuWorkspaces() {
  await connection();
  if (!odtuWorkspacesEnabled()) notFound();
}
