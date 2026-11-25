const MIN_WIDTH = 640;
const MAX_WIDTH = 1100;

/** A window over the right of the browser (so on the same monitor), leaving the page it came from visible beside it. */
function windowFeatures(): string {
  const { availWidth, availHeight } = window.screen;
  const width = Math.round(
    Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, availWidth * 0.6)),
  );
  const height = Math.round(availHeight * 0.85);
  const left = window.screenX + Math.max(0, window.outerWidth - width);
  return `popup=yes,width=${width},height=${height},left=${left},top=${window.screenY}`;
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
