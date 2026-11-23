import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { EmailView } from "@/components/email-center/email-view";
import {
  EmailCampaignStatus,
  EmailRecipientStatus,
  EmailSkipReason,
} from "@/interfaces/email-center";
import { ClientApiError } from "@/lib/client/api";
import * as client from "@/lib/client/email-center";
import { EmailCenterPath } from "@/lib/email-center";
import {
  emailCampaign,
  emailDetail,
  emailRecipient,
} from "@test/fixtures/email-center";
import { freezeDate, renderWithQueryClient } from "@test/test-utils";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock("@/lib/client/email-center");

const sending = (startsAt: string) =>
  emailDetail({
    campaign: emailCampaign({ status: EmailCampaignStatus.Sending, startsAt }),
    recipients: [emailRecipient({ status: EmailRecipientStatus.Pending })],
  });
const stopped = emailDetail({
  campaign: emailCampaign({ status: EmailCampaignStatus.Stopped }),
  recipients: [
    emailRecipient({
      status: EmailRecipientStatus.Skipped,
      errorCode: EmailSkipReason.Stopped,
    }),
  ],
});

beforeEach(() => {
  vi.clearAllMocks();
  freezeDate("2026-11-23T10:00:00Z");
  vi.mocked(client.getEmailCenterOptions).mockResolvedValue({
    sendingOn: true,
    programs: [],
  });
});

afterEach(() => {
  vi.useRealTimers();
});

const view = () =>
  renderWithQueryClient(
    <EmailView
      id={emailCampaign().id}
      basePath={EmailCenterPath.Coordinator}
    />,
  );

it("shows the hold and stops it after asking", async () => {
  vi.mocked(client.getEmailCampaign)
    .mockResolvedValueOnce(sending("2026-11-23T10:04:32Z"))
    .mockResolvedValue(stopped);
  vi.mocked(client.stopEmailSend).mockResolvedValue(stopped);
  view();
  expect(await screen.findByRole("timer")).toHaveTextContent("4:32");
  await userEvent.click(screen.getByRole("button", { name: "Durdur" }));
  expect(client.stopEmailSend).not.toHaveBeenCalled();
  const dialog = screen.getByRole("dialog", {
    name: "Gönderim durdurulsun mu?",
  });
  expect(within(dialog).getByText(/Hiç kimseye/)).toBeInTheDocument();
  await userEvent.click(
    within(dialog).getByRole("button", { name: "Evet, durdur" }),
  );
  expect(await screen.findByText("Gönderim durduruldu.")).toBeInTheDocument();
  expect(client.stopEmailSend).toHaveBeenCalledWith(emailCampaign().id);
  await waitFor(() => {
    expect(
      screen.queryByRole("button", { name: "Durdur" }),
    ).not.toBeInTheDocument();
  });
  expect(screen.getByText("Atlandı")).toBeInTheDocument();
  expect(screen.getAllByText("Durduruldu").length).toBeGreaterThan(1);
});

it("says once mails leave that those cannot be taken back, and can be backed out of", async () => {
  vi.mocked(client.getEmailCampaign).mockResolvedValue(
    sending("2026-11-23T09:59:00Z"),
  );
  view();
  expect(
    await screen.findByText("E-postalar gönderiliyor."),
  ).toBeInTheDocument();
  expect(screen.queryByRole("timer")).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Durdur" }));
  expect(screen.getByText(/yine de ulaşabilir/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Vazgeç" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(client.stopEmailSend).not.toHaveBeenCalled();
});

it("says when it was too late to stop", async () => {
  vi.mocked(client.getEmailCampaign).mockResolvedValue(
    sending("2026-11-23T10:04:32Z"),
  );
  vi.mocked(client.stopEmailSend).mockRejectedValue(
    new ClientApiError("Bu e-posta artık durdurulamaz.", 409),
  );
  view();
  await userEvent.click(await screen.findByRole("button", { name: "Durdur" }));
  await userEvent.click(screen.getByRole("button", { name: "Evet, durdur" }));
  expect(
    await screen.findByText("Bu e-posta artık durdurulamaz."),
  ).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
