// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useEffect, useRef } from "react";

import {
  loadYoutubeApi,
  reachedWatchedShare,
  YOUTUBE_EMBED_ORIGIN,
  type YoutubePlayer,
} from "@/lib/youtube";

const CHECK_EVERY_MS = 1000;

/**
 * The training video on YouTube's privacy-enhanced player. Calls `onWatched` once, when the player ends or
 * passes 90 % of the length (D2b); seeking is not blocked, since a browser can only report watching.
 */
export function TrainingVideo({
  videoId,
  title,
  onWatched,
}: {
  videoId: string;
  title: string;
  onWatched: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const reported = useRef(false);
  const report = useRef(onWatched);
  useEffect(() => {
    report.current = onWatched;
  }, [onWatched]);

  useEffect(() => {
    let player: YoutubePlayer | null = null;
    let timer: number | undefined;
    let cancelled = false;
    const watched = () => {
      if (reported.current) return;
      reported.current = true;
      report.current();
    };
    void loadYoutubeApi().then((youtube) => {
      if (cancelled || !host.current) return;
      player = new youtube.Player(host.current, {
        host: YOUTUBE_EMBED_ORIGIN,
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (event) => {
            if (event.data === youtube.PlayerState.ENDED) watched();
          },
        },
      });
      timer = window.setInterval(() => {
        if (
          player &&
          reachedWatchedShare(player.getCurrentTime(), player.getDuration())
        ) {
          watched();
        }
      }, CHECK_EVERY_MS);
    });
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      player?.destroy();
    };
  }, [videoId]);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
      <div ref={host} title={title} className="size-full" />
    </div>
  );
}
