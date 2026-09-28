import {
  fetchProgramAnnouncements,
  postProgramAnnouncement,
} from "@/lib/api/program-announcements";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    return backendResponse(
      await fetchProgramAnnouncements(auth.session.userId, id),
    );
  } catch (error) {
    return apiErrorResponse(error, { message: "Duyurular yüklenemedi." });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = await request.json();
    return backendResponse(
      await postProgramAnnouncement(auth.session.userId, id, body.body),
    );
  } catch (error) {
    return apiErrorResponse(error, { message: "Duyuru gönderilemedi." });
  }
}
