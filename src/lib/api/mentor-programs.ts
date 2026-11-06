import "server-only";

import { backendRequest } from "@/lib/server/backend-client";

const PATH = "/api/onboarding/mentor-programs";

export function fetchMentorPrograms(idToken: string) {
  return backendRequest<string[]>({ method: "GET", url: PATH }, { idToken });
}

export function saveMentorPrograms(idToken: string, programIds: string[]) {
  return backendRequest<string[]>(
    { method: "PUT", url: PATH, data: { programIds } },
    { idToken },
  );
}
