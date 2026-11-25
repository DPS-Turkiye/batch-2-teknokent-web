const MIN_WIDTH = 640;
const MAX_WIDTH = 1100;

/** A window on the right of the screen, leaving the page the meeting was joined from visible beside it. */
function windowFeatures(screen: Screen): string {
  const width = Math.round(
    Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, screen.availWidth * 0.6)),
  );
  const height = Math.round(screen.availHeight * 0.85);
  const left = Math.max(0, screen.availWidth - width);
  return `popup=yes,width=${width},height=${height},left=${left},top=0`;
}

/** Phones and tablets have no second window to put beside the page, so the meeting stays a normal link there. */
function hasRoomForWindow(): boolean {
  return (
    "matchMedia" in window &&
    window.matchMedia("(pointer: fine) and (min-width: 1024px)").matches
  );
}

/**
 * Opens the meeting in its own window next to the page. False when there is no room for it or the browser blocked
 * it, so the caller lets the link open a tab as usual.
 */
export function openMeetingWindow(href: string): boolean {
  if (!hasRoomForWindow()) return false;
  // "noopener" would make window.open always return null, which looks the same as a blocked window.
  const popup = window.open("", "_blank", windowFeatures(window.screen));
  if (!popup) return false;
  popup.opener = null;
  popup.location.replace(href);
  return true;
}
