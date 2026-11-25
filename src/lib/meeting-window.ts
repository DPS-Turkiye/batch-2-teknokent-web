const MIN_WIDTH = 480;
const MAX_WIDTH = 1100;

/**
 * A window over the left half of the browser (so on the same monitor): the join and recording-bot buttons sit on the
 * right half of the page and stay in reach.
 */
function windowFeatures(): string {
  const { screenX, screenY, outerWidth, outerHeight } = window;
  const width = Math.round(
    Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, outerWidth / 2)),
  );
  const height = Math.round(outerHeight * 0.85);
  return `popup=yes,resizable=yes,width=${width},height=${height},left=${screenX},top=${screenY}`;
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
  const popup = window.open("", "_blank", windowFeatures());
  if (!popup) return false;
  popup.opener = null;
  popup.location.replace(href);
  return true;
}
