import "server-only";

import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

/** A mentee in a program is ranked only among that program's accepted mentors. */
export function recommendMentors(payload: unknown, actorId: string) {
  return backendRequest({
    method: HttpMethod.Post,
    url: "/api/mentor-recommendations",
    data: payload,
    params: { actorId },
  });
}
