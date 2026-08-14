import "server-only";

import { cookies } from "next/headers";

export const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000003";
export const DEFAULT_ORGANIZATION_ID = "10000000-0000-0000-0000-000000000001";

export async function getSessionIds() {
  const cookieStore = await cookies();
  return {
    userId: cookieStore.get("teknokent_user_id")?.value ?? DEFAULT_USER_ID,
    organizationId:
      cookieStore.get("teknokent_organization_id")?.value ??
      DEFAULT_ORGANIZATION_ID,
  };
}
