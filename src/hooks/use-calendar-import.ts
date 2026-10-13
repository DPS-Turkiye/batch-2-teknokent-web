"use client";

import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import { useCreateMeeting } from "@/hooks/use-meetings";
import type { MeetingItem } from "@/interfaces/meeting";
import { parseICalText } from "@/lib/calendar-sync";
import {
  authenticateWithGoogle,
  fetchGoogleCalendarEvents,
  getGoogleClientId,
} from "@/lib/google-calendar";

/**
 * Importing an external Google Calendar (or a .ics export of one) into the
 * mentee's own view. Mentor-only, kept off the mentor calendar: an imported
 * personal event has no mentorship or organization to attach it to, so
 * persisting it through the same /api/meetings mentorship-tracking table
 * doesn't carry the same meaning there.
 *
 * When NEXT_PUBLIC_GOOGLE_CLIENT_ID is unset, this says so rather than
 * fabricating events and claiming a live sync succeeded — the previous
 * behaviour matched PDF finding #5 (Google auth blocked, empty local client
 * ID) but told the user the opposite of what happened.
 */
export function useCalendarImport() {
  const t = useTranslations("calendar.import");
  const { mutateAsync: createMeeting } = useCreateMeeting();
  const [importedMeetings, setImportedMeetings] = useState<MeetingItem[]>([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const persist = useCallback(
    async (events: MeetingItem[]) => {
      for (const item of events) {
        try {
          await createMeeting({
            scheduledAt: new Date(item.scheduledAt).toISOString(),
            durationMinutes: item.durationMinutes || 45,
            agenda: item.agenda || "Google Takvim Etkinliği",
            meetLink: item.meetLink,
            status: "SCHEDULED",
          });
        } catch (reason) {
          console.error("Calendar event import failed", {
            eventId: item.id,
            reason,
          });
        }
      }
    },
    [createMeeting],
  );

  const addImported = useCallback((events: MeetingItem[]) => {
    setImportedMeetings((current) => {
      const byId = new Map(current.map((item) => [item.id, item]));
      for (const event of events) byId.set(event.id, event);
      return [...byId.values()];
    });
  }, []);

  const syncWithGoogle = useCallback(async () => {
    setError(null);
    setSuccessMessage(null);
    if (!getGoogleClientId()) {
      setError(t("notConfigured"));
      return;
    }
    setImporting(true);
    try {
      const { token } = await authenticateWithGoogle();
      const events = await fetchGoogleCalendarEvents(token);
      addImported(events);
      await persist(events);
      setSuccessMessage(t("connected", { count: events.length }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("connectFailed"));
    } finally {
      setImporting(false);
    }
  }, [addImported, persist, t]);

  const importFile = useCallback(
    async (file: File) => {
      setError(null);
      setSuccessMessage(null);
      setImporting(true);
      try {
        const text = await file.text();
        const events = parseICalText(text);
        if (events.length === 0) {
          setError(t("noEvents"));
          return;
        }
        addImported(events);
        await persist(events);
        setSuccessMessage(t("imported", { count: events.length }));
      } catch {
        setError(t("readFailed"));
      } finally {
        setImporting(false);
      }
    },
    [addImported, persist, t],
  );

  return {
    importedMeetings,
    importing,
    error,
    successMessage,
    syncWithGoogle,
    importFile,
  };
}
