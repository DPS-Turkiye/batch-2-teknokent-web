import { fetchProgramNames } from "@/lib/api/programs";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";

/**
 * Deliberately unauthenticated, unlike every other route in this folder: it
 * feeds the signup picker, and someone choosing their program has no account or
 * session cookie yet. The proxy still authenticates to Spring Boot with the
 * service credentials, and the response carries program names only — no
 * coordinator, no mentors, no other startups.
 */
export async function GET() {
  try {
    return backendResponse(await fetchProgramNames());
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Programlar yüklenemedi.",
    });
  }
}
