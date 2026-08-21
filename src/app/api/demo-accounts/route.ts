import { fetchUsers } from "@/lib/api/accounts";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";

export async function GET() {
  try {
    const [mentees, mentors] = await Promise.all([
      fetchUsers("MENTEE"),
      fetchUsers("MENTOR"),
    ]);
    if (mentees.status !== 200) return backendResponse(mentees);
    if (mentors.status !== 200) return backendResponse(mentors);
    return backendResponse({
      ...mentees,
      data: [...mentees.data, ...mentors.data],
    });
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Demo accounts could not be loaded.",
    });
  }
}
