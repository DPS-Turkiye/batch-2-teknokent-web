import "server-only";

import { backendRequest } from "@/lib/server/backend-client";

export function recommendMentors(payload: unknown) {
  return backendRequest({
    method: "POST",
    url: "/api/mentor-recommendations",
    data: payload,
  });
}
