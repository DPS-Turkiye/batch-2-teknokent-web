import "server-only";

import type {
  DevPersona,
  InstitutionLoginCompletion,
  InstitutionLoginStart,
  InstitutionProvider,
} from "@/interfaces/institution-login";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

const BASE = "/api/auth/institution";

export function startInstitutionLogin(provider: InstitutionProvider) {
  return backendRequest<InstitutionLoginStart>({
    method: HttpMethod.Post,
    url: `${BASE}/${provider}/start`,
  });
}

export function finishInstitutionCallback(
  provider: InstitutionProvider,
  state: string,
  params: Record<string, string>,
) {
  return backendRequest<{ code: string }>({
    method: HttpMethod.Post,
    url: `${BASE}/${provider}/callback`,
    data: { state, params },
  });
}

export function exchangeInstitutionCode(code: string) {
  return backendRequest<InstitutionLoginCompletion>({
    method: HttpMethod.Post,
    url: `${BASE}/exchange`,
    data: { code },
  });
}

export function fetchDevPersonas(provider: InstitutionProvider) {
  return backendRequest<DevPersona[]>({
    method: HttpMethod.Get,
    url: `${BASE}/${provider}/dev-personas`,
  });
}
