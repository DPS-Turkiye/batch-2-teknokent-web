/** The only video host the training embeds; the privacy-enhanced domain sets no cookies until playback. */
export const YOUTUBE_EMBED_ORIGIN = "https://www.youtube-nocookie.com";

export function youtubeWatchUrl(videoId: string) {
  return `https://youtu.be/${encodeURIComponent(videoId)}`;
}
