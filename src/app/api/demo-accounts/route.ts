import { fetchUsers } from "@/lib/api/accounts";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";

export async function GET() {
  try {
    return backendResponse(await fetchUsers("MENTEE"));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Demo accounts could not be loaded.",
    });
  }
}
