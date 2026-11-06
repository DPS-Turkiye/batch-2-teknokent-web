import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

const PATH = "/api/onboarding/mentor-programs";

function bearer(idToken: string) {
  return { headers: { Authorization: `Bearer ${idToken}` } };
}

/** The programs the mentor asked for or already belongs to. */
export async function getMentorPrograms(idToken: string) {
  return requireSuccess(await httpClient.get<string[]>(PATH, bearer(idToken)));
}

export async function chooseMentorPrograms(
  programIds: string[],
  idToken: string,
) {
  return requireSuccess(
    await httpClient.put<string[]>(PATH, { programIds }, bearer(idToken)),
  );
}
