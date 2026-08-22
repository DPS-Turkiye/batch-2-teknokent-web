export const HttpMethod = {
  Get: "GET",
  Post: "POST",
  Patch: "PATCH",
  Delete: "DELETE",
} as const;

export type HttpMethod = (typeof HttpMethod)[keyof typeof HttpMethod];
