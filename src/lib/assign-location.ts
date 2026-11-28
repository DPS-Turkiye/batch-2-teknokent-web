export function assignLocation(url: string) {
  window.location.assign(url);
}

/** A full page load that leaves nothing of the current page in history or memory. */
export function replaceLocation(url: string) {
  window.location.replace(url);
}

/** Loads the current page again, from the server, with nothing kept in memory. */
export function reloadPage() {
  window.location.reload();
}
