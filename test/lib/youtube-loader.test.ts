import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { YoutubePlayer } from "@/lib/youtube";

class FakePlayer implements YoutubePlayer {
  getCurrentTime() {
    return 0;
  }
  getDuration() {
    return 100;
  }
  destroy() {}
}

const fakeYoutube = { Player: FakePlayer, PlayerState: { ENDED: 0 } };

/** A fresh copy of the module, so its one-time loader starts unused. */
async function freshLoader() {
  vi.resetModules();
  const { loadYoutubeApi } = await import("@/lib/youtube");
  return loadYoutubeApi;
}

/** Calls the ready handler the way the IFrame API script does once it has loaded. */
function fireReady() {
  const ready: (() => void) | undefined = window.onYouTubeIframeAPIReady;
  if (!ready) throw new Error("no ready handler was set");
  ready();
}

function apiScripts() {
  return document.head.querySelectorAll(
    'script[src="https://www.youtube.com/iframe_api"]',
  );
}

describe("loadYoutubeApi", () => {
  beforeEach(() => {
    delete window.YT;
    delete window.onYouTubeIframeAPIReady;
  });

  afterEach(() => {
    for (const script of apiScripts()) script.remove();
    delete window.YT;
    delete window.onYouTubeIframeAPIReady;
  });

  it("answers the API at once when the page already loaded it", async () => {
    window.YT = fakeYoutube;
    const loadYoutubeApi = await freshLoader();

    await expect(loadYoutubeApi()).resolves.toBe(fakeYoutube);
    expect(apiScripts()).toHaveLength(0);
  });

  it("adds the API script once however many players ask for it", async () => {
    const loadYoutubeApi = await freshLoader();

    const first = loadYoutubeApi();
    const second = loadYoutubeApi();

    expect(second).toBe(first);
    expect(apiScripts()).toHaveLength(1);
    expect(apiScripts()[0]).toHaveProperty("async", true);
  });

  it("resolves once YouTube calls back with the API in place", async () => {
    const loadYoutubeApi = await freshLoader();
    const loading = loadYoutubeApi();

    window.YT = fakeYoutube;
    fireReady();

    await expect(loading).resolves.toBe(fakeYoutube);
  });

  it("still calls a ready handler another script set before it", async () => {
    const previous = vi.fn();
    window.onYouTubeIframeAPIReady = previous;
    const loadYoutubeApi = await freshLoader();
    const loading = loadYoutubeApi();

    window.YT = fakeYoutube;
    fireReady();

    await loading;
    expect(previous).toHaveBeenCalledTimes(1);
  });

  it("keeps waiting when the callback fires before the API is there", async () => {
    const loadYoutubeApi = await freshLoader();
    const loading = loadYoutubeApi();

    fireReady();
    const pending = Symbol("pending");
    const settled = await Promise.race([
      loading,
      new Promise<typeof pending>((resolve) => {
        setTimeout(() => {
          resolve(pending);
        }, 0);
      }),
    ]);

    expect(settled).toBe(pending);
  });
});
