import "server-only";

import axios, {
  type AxiosRequestConfig,
  type RawAxiosResponseHeaders,
} from "axios";

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
  options: { authenticated?: boolean } = {},
): Promise<BackendResponse<T>> {
  const response = await axios.request<T>({
    baseURL: getBackendUrl(),
    ...config,
    headers: { Accept: "application/json", ...config.headers },
    validateStatus: () => true,
    auth: options.authenticated === false ? undefined : backendCredentials(),
  });

  return {
    data: response.data,
    headers: response.headers,
    status: response.status,
  };
}
