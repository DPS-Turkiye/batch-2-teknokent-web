import type {
  DevPersona,
  InstitutionLoginCompletion,
  InstitutionLoginStart,
  InstitutionProvider,
} from "@/interfaces/institution-login";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function startInstitutionLogin(provider: InstitutionProvider) {
  return requireSuccess(
    await httpClient.post<InstitutionLoginStart>(
      `/api/institution-login/${provider}/start`,
    ),
  );
}

export async function completeInstitutionLogin(
  provider: InstitutionProvider,
  state: string,
  params: Record<string, string>,
) {
  return requireSuccess(
    await httpClient.post<InstitutionLoginCompletion>(
      `/api/institution-login/${provider}/complete`,
      { state, params },
    ),
  );
}

export async function fetchDevPersonas() {
  return requireSuccess(
    await httpClient.get<DevPersona[]>("/api/institution-login/dev-personas"),
  );
}
