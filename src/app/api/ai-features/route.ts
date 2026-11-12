import { fetchAiFeatures } from "@/lib/api/ai-features";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";

/**
 * Deliberately unauthenticated: the signup CV step reads it before there is a session. The proxy still
 * authenticates to Spring Boot with the service credentials, and the answer is five deployment-wide switches,
 * nothing about any person.
 */
export async function GET() {
  try {
    return backendResponse(await fetchAiFeatures());
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("aiFeaturesLoadFailed"),
    });
  }
}
