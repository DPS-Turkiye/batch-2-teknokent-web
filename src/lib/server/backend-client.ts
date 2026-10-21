import "server-only";

import axios, {
  type AxiosRequestConfig,
  type RawAxiosResponseHeaders,
} from "axios";
import { getLocale } from "next-intl/server";

import { getBackendUrl } from "@/lib/const";

export type BackendResponse<T = unknown> = {
  data: T;
  headers: RawAxiosResponseHeaders;
  status: number;
};

function backendCredentials() {
  const username = process.env.BACKEND_USERNAME;
  const password = process.env.BACKEND_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "BACKEND_USERNAME and BACKEND_PASSWORD must be configured for server API routes.",
    );
  }

  return { username, password };
}

export async function backendRequest<T = unknown>(
  config: AxiosRequestConfig,
  options: { authenticated?: boolean; idToken?: string } = {},
): Promise<BackendResponse<T>> {
  const useBasic = options.authenticated !== false && !options.idToken;
  const response = await axios.request<T>({
    baseURL: getBackendUrl(),
    timeout: 15000,
    ...config,
    headers: {
      Accept: "application/json",
      // Backend errors, field messages and match reasons follow it.
      "Accept-Language": await getLocale(),
      ...(options.idToken
        ? { Authorization: `Bearer ${options.idToken}` }
        : undefined),
      ...config.headers,
    },
    validateStatus: () => true,
    auth: useBasic ? backendCredentials() : undefined,
  });

  return {
    data: response.data,
    headers: response.headers,
    status: response.status,
  };
}
