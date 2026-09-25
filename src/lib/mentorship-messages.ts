/** A shared file travels as a plain message with this prefix and the file name. */
export const SHARED_FILE_PREFIX = "Dosya paylaşıldı:";

export function sharedFileMessage(fileName: string) {
  return `${SHARED_FILE_PREFIX} ${fileName}`;
}

export function sharedFileName(body: string) {
  return body.startsWith(SHARED_FILE_PREFIX)
    ? body.slice(SHARED_FILE_PREFIX.length).trim()
    : null;
}
