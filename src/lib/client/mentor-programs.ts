import { requireSuccess } from "@/lib/client/api";
import { backendHttp, withToken } from "@/lib/client/backend-http";

// Mentor onboarding runs before the account is approved, so there is no session; only the Firebase token counts.
const PATH = "/api/onboarding/mentor-programs";

/** The programs the mentor asked for or already belongs to. */
export async function getMentorPrograms(idToken: string) {
  return requireSuccess(
    await backendHttp.get<string[]>(PATH, withToken(idToken)),
  );
}

export async function chooseMentorPrograms(
  programIds: string[],
  idToken: string,
) {
  return requireSuccess(
    await backendHttp.put<string[]>(PATH, { programIds }, withToken(idToken)),
  );
}
