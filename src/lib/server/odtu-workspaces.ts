import "server-only";

import { notFound } from "next/navigation";

/**
 * The ODTÜ student and academician workspaces stay unreachable until this is "true". Unset
 * (as on the deployed app, whose build writes only the keys amplify.yml lists) they answer
 * like a route that does not exist.
 */
export function odtuWorkspacesEnabled() {
  return process.env.ODTU_WORKSPACES_ENABLED === "true";
}

export function requireOdtuWorkspaces() {
  if (!odtuWorkspacesEnabled()) notFound();
}
