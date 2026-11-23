import "server-only";

import type {
  EmailCampaign,
  EmailCampaignDetail,
  EmailCenterOptions,
  EmailConfirmation,
  EmailDraft,
  EmailTemplate,
} from "@/interfaces/email-center";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

const BASE = "/api/email-center";

function campaignUrl(id: string, step = "") {
  return `${BASE}/campaigns/${encodeURIComponent(id)}${step}`;
}

export function fetchEmailCenterOptions(actorId: string) {
  return backendRequest<EmailCenterOptions>({
    method: HttpMethod.Get,
    url: `${BASE}/options`,
    params: { actorId },
  });
}

export function fetchEmailTemplates(actorId: string, programId: string) {
  return backendRequest<EmailTemplate[]>({
    method: HttpMethod.Get,
    url: `${BASE}/templates`,
    params: { actorId, programId },
  });
}

export function fetchEmailCampaigns(actorId: string) {
  return backendRequest<EmailCampaign[]>({
    method: HttpMethod.Get,
    url: `${BASE}/campaigns`,
    params: { actorId },
  });
}

export function fetchEmailCampaign(actorId: string, id: string) {
  return backendRequest<EmailCampaignDetail>({
    method: HttpMethod.Get,
    url: campaignUrl(id),
    params: { actorId },
  });
}

export function createEmailCampaign(actorId: string, draft: EmailDraft) {
  return backendRequest<EmailCampaignDetail>({
    method: HttpMethod.Post,
    url: `${BASE}/campaigns`,
    data: { ...draft, actorId },
  });
}

export function updateEmailCampaign(
  actorId: string,
  id: string,
  draft: EmailDraft,
) {
  return backendRequest<EmailCampaignDetail>({
    method: HttpMethod.Put,
    url: campaignUrl(id),
    data: { ...draft, actorId },
  });
}

export function deleteEmailCampaign(actorId: string, id: string) {
  return backendRequest<null>({
    method: HttpMethod.Delete,
    url: campaignUrl(id),
    params: { actorId },
  });
}

export function testEmailCampaign(actorId: string, id: string) {
  return backendRequest<EmailCampaignDetail>({
    method: HttpMethod.Post,
    url: campaignUrl(id, "/test"),
    data: { actorId },
  });
}

export function reviewEmailCampaign(actorId: string, id: string) {
  return backendRequest<EmailCampaignDetail>({
    method: HttpMethod.Post,
    url: campaignUrl(id, "/review"),
    data: { actorId },
  });
}

export function sendEmailCampaign(
  actorId: string,
  id: string,
  confirmation: EmailConfirmation,
) {
  return backendRequest<EmailCampaignDetail>({
    method: HttpMethod.Post,
    url: campaignUrl(id, "/send"),
    data: { ...confirmation, actorId },
  });
}

export function unsubscribeEmail(token: string) {
  return backendRequest<null>({
    method: HttpMethod.Post,
    url: `${BASE}/unsubscribe`,
    data: { token },
  });
}
