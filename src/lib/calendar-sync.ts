import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";

/**
 * The pure, testable half of Google/iCal sync — no browser APIs, no React.
 * Shared by the mentor and mentee calendars via use-calendar-sync.
 */

/** The event copy, from `calendar.sync` in the message files. */
export type CalendarEventText = {
  fallbackTitle: string;
  description: (link: string) => string;
};

function formatICalTimestamp(date: Date) {
  return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
}

export function googleCalendarAddUrl(
  meeting: MeetingItem,
  text: CalendarEventText,
) {
  const start = new Date(meeting.scheduledAt);
  const end = new Date(
    start.getTime() + (meeting.durationMinutes || 45) * 60000,
  );
  const title = encodeURIComponent(meeting.agenda ?? text.fallbackTitle);
  const details = encodeURIComponent(
    text.description(meeting.meetLink ?? "N/A"),
  );
  const location = encodeURIComponent(meeting.meetLink ?? "Online");
  const dates = `${formatICalTimestamp(start)}/${formatICalTimestamp(end)}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}

export function icalFileContents(
  meeting: MeetingItem,
  text: CalendarEventText,
) {
  const start = new Date(meeting.scheduledAt);
  const end = new Date(
    start.getTime() + (meeting.durationMinutes || 45) * 60000,
  );
  const title = meeting.agenda ?? text.fallbackTitle;
  const meetLink = meeting.meetLink ?? "Online";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Teknokent//Mentorluk System//TR",
    "BEGIN:VEVENT",
    `UID:${meeting.id}@teknokent.dps`,
    `DTSTAMP:${formatICalTimestamp(new Date())}`,
    `DTSTART:${formatICalTimestamp(start)}`,
    `DTEND:${formatICalTimestamp(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${text.description(meetLink)}`,
    `LOCATION:${meetLink}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/** Parses a .ics export (e.g. from Google Calendar) into MeetingItem-shaped events. */
export function parseICalText(icsText: string): MeetingItem[] {
  const events: MeetingItem[] = [];
  const veventBlocks = icsText.split("BEGIN:VEVENT");

  for (let i = 1; i < veventBlocks.length; i++) {
    const block = veventBlocks[i];
    if (!block) continue;
    const summaryMatch = /SUMMARY:(.*)/.exec(block);
    const dtstartMatch = /DTSTART[:;](?:TZID=[^:]+:)?(\d{8}T?\d{0,6}Z?)/.exec(
      block,
    );
    const dtendMatch = /DTEND[:;](?:TZID=[^:]+:)?(\d{8}T?\d{0,6}Z?)/.exec(
      block,
    );
    const locationMatch = /LOCATION:(.*)/.exec(block);

    if (!dtstartMatch) continue;

    const rawStart = dtstartMatch[1];
    if (!rawStart) continue;
    const y = parseInt(rawStart.substring(0, 4), 10);
    const m = parseInt(rawStart.substring(4, 6), 10) - 1;
    const d = parseInt(rawStart.substring(6, 8), 10);
    let hh = 12;
    let mm = 0;
    if (rawStart.includes("T")) {
      const timePart = rawStart.split("T")[1];
      if (timePart) {
        hh = parseInt(timePart.substring(0, 2), 10);
        mm = parseInt(timePart.substring(2, 4), 10);
      }
    }
    const startDate = new Date(Date.UTC(y, m, d, hh, mm));

    let duration = 45;
    if (dtendMatch) {
      const rawEnd = dtendMatch[1];
      if (rawEnd) {
        const ey = parseInt(rawEnd.substring(0, 4), 10);
        const em = parseInt(rawEnd.substring(4, 6), 10) - 1;
        const ed = parseInt(rawEnd.substring(6, 8), 10);
        let ehh = 12;
        let emm = 0;
        if (rawEnd.includes("T")) {
          const timePart = rawEnd.split("T")[1];
          if (timePart) {
            ehh = parseInt(timePart.substring(0, 2), 10);
            emm = parseInt(timePart.substring(2, 4), 10);
          }
        }
        const endDate = new Date(Date.UTC(ey, em, ed, ehh, emm));
        duration = Math.max(
          15,
          Math.round((endDate.getTime() - startDate.getTime()) / 60000),
        );
      }
    }

    events.push({
      id: `gcal-${startDate.getTime()}-${i}`,
      organizationId: "google-import",
      scheduledAt: startDate.toISOString(),
      durationMinutes: duration,
      agenda: summaryMatch?.[1]?.trim() || "Google Takvim Etkinliği",
      meetLink: locationMatch?.[1]?.trim() || undefined,
      status: MeetingStatus.GoogleCalendar,
    });
  }
  return events;
}
