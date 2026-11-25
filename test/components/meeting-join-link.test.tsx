import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MeetingJoinLink } from "@/components/meeting-join-link";

const HREF = "https://meet.google.com/abc-defg-hij";
const popup = { opener: {} as unknown, location: { replace: vi.fn() } };
const open = vi.fn();

function screenHasRoom(matches: boolean) {
  vi.stubGlobal("matchMedia", () => ({ matches }));
}

function clickLink(href = HREF, init: MouseEventInit = {}) {
  render(
    <MeetingJoinLink href={href} className="">
      Katıl
    </MeetingJoinLink>,
  );
  const link = screen.getByRole("link", { name: "Katıl" });
  const click = createEvent.click(link, init);
  fireEvent(link, click);
  return { link, click };
}

describe("MeetingJoinLink", () => {
  beforeEach(() => {
    popup.opener = {};
    popup.location.replace.mockReset();
    open.mockReset().mockReturnValue(popup);
    vi.stubGlobal("open", open);
    screenHasRoom(true);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("opens the meeting in its own window and cuts its way back to the page", () => {
    const { click } = clickLink();
    expect(click.defaultPrevented).toBe(true);
    expect(open).toHaveBeenCalledWith(
      "",
      "_blank",
      expect.stringMatching(
        /^popup=yes,width=\d+,height=\d+,left=\d+,top=\d+$/,
      ),
    );
    expect(popup.opener).toBeNull();
    expect(popup.location.replace).toHaveBeenCalledWith(HREF);
  });

  it("stays a new-tab link where a second window does not fit", () => {
    screenHasRoom(false);
    const { link, click } = clickLink();
    expect(open).not.toHaveBeenCalled();
    expect(click.defaultPrevented).toBe(false);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("href", HREF);
  });

  it("falls back to the tab when the browser blocks the window", () => {
    open.mockReturnValue(null);
    expect(clickLink().click.defaultPrevented).toBe(false);
  });

  it("leaves a click that asks for a tab or a window of its own alone", () => {
    expect(clickLink(HREF, { metaKey: true }).click.defaultPrevented).toBe(
      false,
    );
    expect(open).not.toHaveBeenCalled();
  });

  it("never opens an address that is not a web link in the window", () => {
    expect(clickLink("meet.google.com/abc").click.defaultPrevented).toBe(false);
    expect(open).not.toHaveBeenCalled();
  });
});
