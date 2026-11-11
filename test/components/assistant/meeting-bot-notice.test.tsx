import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MeetingBotNoticeLine } from "@/components/assistant/meeting-bot-notice";
import { MeetingBotNotice, MeetingBotNoticeTone } from "@/types/assistant";
import { InLocale } from "@test/test-utils";

describe("MeetingBotNoticeLine", () => {
  it("tells the host to admit a bot in the lobby", () => {
    render(
      <MeetingBotNoticeLine
        notice={MeetingBotNotice.WaitingForAdmission}
        tone={MeetingBotNoticeTone.Info}
      />,
    );

    expect(
      screen.getByRole("status", { name: "Kayıt botunun durumu" }),
    ).toHaveTextContent("Kayıt botu bekleme odasında.");
  });

  it("shows a warning in the danger colour", () => {
    render(
      <MeetingBotNoticeLine
        notice={MeetingBotNotice.WaitingTooLong}
        tone={MeetingBotNoticeTone.Danger}
      />,
    );

    expect(screen.getByRole("status")).toHaveAttribute(
      "style",
      expect.stringContaining("var(--ma-danger)"),
    );
  });

  it("reads in English", () => {
    render(
      <InLocale locale="en">
        <MeetingBotNoticeLine
          notice={MeetingBotNotice.Recording}
          tone={MeetingBotNoticeTone.Success}
        />
      </InLocale>,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "The recording bot is in the meeting and recording.",
    );
  });

  it("puts the wait limit into the warning", () => {
    render(
      <MeetingBotNoticeLine
        notice={MeetingBotNotice.WaitingTooLong}
        tone={MeetingBotNoticeTone.Danger}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Bot 2 dakikadır bekleme odasında.",
    );
  });

  it("keeps an empty status region without a notice, so the next state is announced", () => {
    render(
      <MeetingBotNoticeLine notice={null} tone={MeetingBotNoticeTone.Info} />,
    );

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
