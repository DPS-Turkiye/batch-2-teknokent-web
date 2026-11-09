import "server-only";

import type { StudentProfileCompletion } from "@/interfaces/student-profile-completion";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

const URL = "/api/student/profile-completion";

export function fetchStudentProfileCompletion(actorId: string) {
  return backendRequest<StudentProfileCompletion>({
    method: HttpMethod.Get,
    url: URL,
    params: { actorId },
  });
}

export function saveStudentProfileCompletion(
  actorId: string,
  input: StudentProfileCompletion,
) {
  return backendRequest<StudentProfileCompletion>({
    method: HttpMethod.Put,
    url: URL,
    data: { ...input, actorId },
  });
}
