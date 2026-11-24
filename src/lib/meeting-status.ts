import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";

/** Cancelled, or missed by the startup: it never counts as a meeting that was held. */
export function didNotTakePlace(
  meeting: Pick<MeetingItem, "status" | "noShowAt">,
) {
  return (
    meeting.status === MeetingStatus.Cancelled || Boolean(meeting.noShowAt)
  );
}
