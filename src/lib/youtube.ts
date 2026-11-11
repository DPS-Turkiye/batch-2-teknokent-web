/** The only video host the training embeds; the privacy-enhanced domain sets no cookies until playback. */
export const YOUTUBE_EMBED_ORIGIN = "https://www.youtube-nocookie.com";

export function youtubeWatchUrl(videoId: string) {
  return `https://youtu.be/${encodeURIComponent(videoId)}`;
}

/** D2b: the end, or this share of the length, counts as watched. */
export const WATCHED_SHARE = 0.9;

/** The few calls the training needs from the IFrame Player API. */
export type YoutubePlayer = {
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
};

type YoutubeNamespace = {
  Player: new (
    element: HTMLElement,
    options: {
      host: string;
      videoId: string;
      playerVars?: Record<string, number | string>;
      events?: { onStateChange?: (event: { data: number }) => void };
    },
  ) => YoutubePlayer;
  PlayerState: { ENDED: number };
};

declare global {
  interface Window {
    YT?: YoutubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let loading: Promise<YoutubeNamespace> | null = null;

/** Loads the IFrame Player API once (its script comes from www.youtube.com, allowed in the CSP). */
export function loadYoutubeApi(): Promise<YoutubeNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  loading ??= new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.appendChild(script);
  });
  return loading;
}

/** Whether the player is far enough in to count the video as watched. */
export function reachedWatchedShare(currentTime: number, duration: number) {
  return duration > 0 && currentTime >= duration * WATCHED_SHARE;
}
