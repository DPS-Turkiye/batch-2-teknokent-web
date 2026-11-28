import { clientText } from "@/i18n/client-texts";
import type {
  EmailCampaign,
  EmailCampaignDetail,
  EmailCenterOptions,
  EmailConfirmation,
  EmailDraft,
  EmailTemplate,
} from "@/interfaces/email-center";
import { jsonFitsAmplifyWaf } from "@/lib/amplify-safe-body";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";
import { httpClient } from "@/lib/http-client";

const BASE = "/api/email-center";

function campaignUrl(id: string, step = "") {
  return `${BASE}/campaigns/${encodeURIComponent(id)}${step}`;
}

/** The hosting's firewall drops larger bodies with a page that says nothing, so it is said here first. */
function requireFits(payload: unknown) {
  if (!jsonFitsAmplifyWaf(payload)) throw new Error(clientText("emailTooLong"));
}

export async function getEmailCenterOptions() {
  return requireSuccess(
    await backendHttp.get<EmailCenterOptions>(`${BASE}/options`),
  );
}

export async function getEmailTemplates(programId: string) {
  return requireSuccess(
    await backendHttp.get<EmailTemplate[]>(`${BASE}/templates`, {
      params: { programId },
    }),
  );
}

export async function getEmailCampaigns() {
  return requireSuccess(
    await backendHttp.get<EmailCampaign[]>(`${BASE}/campaigns`),
  );
}

export async function getEmailCampaign(id: string) {
  return requireSuccess(
    await backendHttp.get<EmailCampaignDetail>(campaignUrl(id)),
  );
}

/** The subject goes trimmed: the backend counts its limit on what it receives. */
export async function saveEmailDraft(id: string | null, draft: EmailDraft) {
  const body = { ...draft, subject: draft.subject.trim() };
  requireFits(body);
  return requireSuccess(
    id === null
      ? await backendHttp.post<EmailCampaignDetail>(`${BASE}/campaigns`, body)
      : await backendHttp.put<EmailCampaignDetail>(campaignUrl(id), body),
  );
}

export async function removeEmailDraft(id: string) {
  return requireSuccess(await backendHttp.delete<null>(campaignUrl(id)));
}

export async function sendEmailTest(id: string) {
  return requireSuccess(
    await backendHttp.post<EmailCampaignDetail>(campaignUrl(id, "/test")),
  );
}

export async function reviewEmailRecipients(id: string) {
  return requireSuccess(
    await backendHttp.post<EmailCampaignDetail>(campaignUrl(id, "/review")),
  );
}

export async function confirmEmailSend(
  id: string,
  confirmation: EmailConfirmation,
) {
  requireFits(confirmation);
  return requireSuccess(
    await backendHttp.post<EmailCampaignDetail>(
      campaignUrl(id, "/send"),
      confirmation,
    ),
  );
}

export async function stopEmailSend(id: string) {
  return requireSuccess(
    await backendHttp.post<EmailCampaignDetail>(campaignUrl(id, "/stop")),
  );
}

export async function unsubscribeFromEmails(token: string) {
  return requireSuccess(
    await httpClient.post<null>(
      `/api/email-unsubscribe?${new URLSearchParams({ t: token })}`,
    ),
  );
}
