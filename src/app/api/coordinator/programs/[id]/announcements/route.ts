import { z } from "zod";

import { AnnouncementAudience } from "@/interfaces/program-announcement";
import {
  fetchProgramAnnouncements,
  postProgramAnnouncement,
} from "@/lib/api/program-announcements";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

const announcementSchema = z.object({
  body: z.string(),
  // Optional so a page loaded before the audience existed still posts, to everyone as it did then.
  audience: z.enum(AnnouncementAudience).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    return backendResponse(
      await fetchProgramAnnouncements(auth.session.userId, id),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("announcementsLoadFailed"),
    });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const announcement = await readJsonBody(request, announcementSchema);
    if (!announcement.ok) return announcement.response;
    return backendResponse(
      await postProgramAnnouncement(auth.session.userId, id, {
        body: announcement.data.body,
        audience: announcement.data.audience ?? AnnouncementAudience.Everyone,
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("announcementSendFailed"),
    });
  }
}
