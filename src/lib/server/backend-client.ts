import axios, {
  type AxiosRequestConfig,
  type RawAxiosRequestHeaders,
  type RawAxiosResponseHeaders,
} from "axios";
import { getLocale } from "next-intl/server";
import "server-only";

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

/** Plain headers only, so they can be merged over the defaults; basic auth is always this module's. */
export type BackendRequestConfig = Omit<
  AxiosRequestConfig,
  "auth" | "headers"
> & { headers?: RawAxiosRequestHeaders };

export async function backendRequest<T = unknown>(
  config: BackendRequestConfig,
  options: { authenticated?: boolean; idToken?: string | undefined } = {},
): Promise<BackendResponse<T>> {
  const useBasic = options.authenticated !== false && !options.idToken;
  const request: AxiosRequestConfig = {
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
  };
  const response = await axios.request<T>(
    useBasic ? { ...request, auth: backendCredentials() } : request,
  );

  return {
    data: response.data,
    headers: response.headers,
    status: response.status,
  };
}
