import "server-only";

import type { StartupStage } from "@/interfaces/startup-process";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

function processUrl(organizationId: string) {
  return `/api/organizations/${encodeURIComponent(organizationId)}/process`;
}

export function fetchStartupProcess(organizationId: string, actorId: string) {
  return backendRequest({
    method: HttpMethod.Get,
    url: processUrl(organizationId),
    params: { actorId },
  });
}

export function submitProcessAssignment(
  organizationId: string,
  assignmentId: string,
  actorId: string,
  documentId: string,
) {
  return backendRequest({
    method: HttpMethod.Put,
    url: `${processUrl(organizationId)}/assignments/${encodeURIComponent(assignmentId)}/submission`,
    data: { actorId, documentId },
  });
}

export function updateProcessStage(
  organizationId: string,
  actorId: string,
  stage: StartupStage,
) {
  return backendRequest({
    method: HttpMethod.Put,
    url: `${processUrl(organizationId)}/stage`,
    data: { actorId, stage },
  });
}
