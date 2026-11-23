import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EmailComposeForm } from "@/components/email-center/email-compose-form";
import { EmailView } from "@/components/email-center/email-view";
import { EmailsView } from "@/components/email-center/emails-view";
import { UnsubscribeView } from "@/components/email-center/unsubscribe-view";
import {
  EmailAudience,
  EmailCampaignStatus,
  EmailExclusion,
  EmailRecipientStatus,
} from "@/interfaces/email-center";
import { ClientApiError } from "@/lib/client/api";
import * as client from "@/lib/client/email-center";
import { EmailCenterPath, EmailSendRefusal } from "@/lib/email-center";
import {
  emailCampaign,
  emailDetail,
  emailRecipient,
} from "@test/fixtures/email-center";
import { renderWithQueryClient } from "@test/test-utils";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/lib/client/email-center");
vi.mock("@/components/email-center/formatted-text-editor", () => ({
  FormattedTextEditor: ({
    html,
    onChange,
  }: {
    html: string;
    onChange: (html: string) => void;
  }) => (
    <textarea
      aria-label="E-posta metni"
      defaultValue={html}
      onChange={(event) => {
        onChange(event.target.value);
      }}
    />
  ),
}));

const program = { id: emailCampaign().programId, name: "Build '26" };
const ready = emailDetail({
  campaign: emailCampaign({ testSentAt: "2026-11-23T09:00:00Z" }),
  reviewDigest: "digest-1",
  recipients: [
    emailRecipient(),
    emailRecipient({ id: "r2", fullName: "Can Üye", address: "can@x.test" }),
    emailRecipient({
      id: "r3",
      fullName: "Ayrılan",
      status: EmailRecipientStatus.Excluded,
      exclusion: EmailExclusion.Unsubscribed,
    }),
  ],
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(client.getEmailCenterOptions).mockResolvedValue({
    sendingOn: true,
    programs: [program],
  });
  vi.mocked(client.getEmailTemplates).mockResolvedValue([
    {
      key: "inviteReminder",
      name: "Davet hatırlatması",
      audience: EmailAudience.Unjoined,
      subject: "Kaydını tamamla",
      bodyHtml: "<p>Hatırlatma</p>",
    },
  ]);
});

const view = () =>
  renderWithQueryClient(
    <EmailView
      id={emailCampaign().id}
      basePath={EmailCenterPath.Coordinator}
    />,
  );
const button = (name: string | RegExp) => screen.findByRole("button", { name });

describe("the list of mails", () => {
  it("shows what was sent and how many did not arrive", async () => {
    vi.mocked(client.getEmailCampaigns).mockResolvedValue([
      emailCampaign({
        status: EmailCampaignStatus.Sent,
        counts: {
          [EmailRecipientStatus.Sent]: 4,
          [EmailRecipientStatus.Bounced]: 1,
        },
      }),
    ]);
    renderWithQueryClient(<EmailsView basePath={EmailCenterPath.Admin} />);
    const link = await screen.findByRole("link", { name: /Duyuru konusu/ });
    expect(link).toHaveAttribute("href", `/admin/emails/${emailCampaign().id}`);
    expect(link).toHaveTextContent("4 kişiye gönderildi");
    expect(link).toHaveTextContent("1 sorun");
  });

  it("says that sending is off and that there is nothing yet", async () => {
    vi.mocked(client.getEmailCampaigns).mockResolvedValue([]);
    vi.mocked(client.getEmailCenterOptions).mockResolvedValue({
      sendingOn: false,
      programs: [],
    });
    renderWithQueryClient(<EmailsView basePath={EmailCenterPath.Admin} />);
    expect(await screen.findByText("Henüz e-posta yok.")).toBeInTheDocument();
    expect(await screen.findByText(/gönderimi şu anda kapalı/)).toBeVisible();
  });

  it("shows why it could not be loaded", async () => {
    vi.mocked(client.getEmailCampaigns).mockRejectedValue(new Error("yok"));
    renderWithQueryClient(<EmailsView basePath={EmailCenterPath.Admin} />);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});

describe("writing a mail", () => {
  it("starts from a template and saves the draft", async () => {
    vi.mocked(client.saveEmailDraft).mockResolvedValue(emailDetail());
    renderWithQueryClient(
      <EmailComposeForm detail={null} basePath={EmailCenterPath.Coordinator} />,
    );
    await screen.findByRole("option", { name: "Build '26" });
    await userEvent.selectOptions(screen.getByLabelText("Program"), program.id);
    await screen.findByRole("option", { name: "Davet hatırlatması" });
    await userEvent.selectOptions(
      screen.getByLabelText("Şablon"),
      "inviteReminder",
    );
    expect(screen.getByLabelText("Konu")).toHaveValue("Kaydını tamamla");
    await userEvent.click(await button("Kaydet"));
    await waitFor(() => {
      expect(client.saveEmailDraft).toHaveBeenCalledWith(null, {
        programId: program.id,
        audience: EmailAudience.Unjoined,
        subject: "Kaydını tamamla",
        bodyHtml: "<p>Hatırlatma</p>",
      });
    });
    expect(replace).toHaveBeenCalledWith(
      `/coordinator/emails/${emailCampaign().id}`,
    );
  });

  it("cannot be sent before its test and its review", async () => {
    vi.mocked(client.getEmailCampaign).mockResolvedValue(emailDetail());
    view();
    expect(await button("Bana test gönder")).toBeEnabled();
    expect(await button(/kişiye gönder/)).toBeDisabled();
    expect(screen.getByText(/elif@example.test/)).toBeInTheDocument();
  });

  it("sends exactly the ticked people of the reviewed list", async () => {
    vi.mocked(client.getEmailCampaign).mockResolvedValue(ready);
    vi.mocked(client.confirmEmailSend).mockResolvedValue(ready);
    view();
    const list = await screen.findByRole("table", { name: /alacaklar \(2\)/ });
    expect(within(list).getByText("ayse@example.test")).toBeInTheDocument();
    const out = screen.getByRole("table", { name: /Almayacaklar \(1\)/ });
    expect(
      within(out).getByText("E-posta almak istemiyor"),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("checkbox", { name: "Can Üye kişisine gönder" }),
    );
    await userEvent.click(await button("1 kişiye gönder"));
    expect(client.confirmEmailSend).not.toHaveBeenCalled();
    await userEvent.click(await button("Evet, gönder"));
    await waitFor(() => {
      expect(client.confirmEmailSend).toHaveBeenCalledWith(emailCampaign().id, {
        reviewDigest: "digest-1",
        untickedIds: ["r2"],
        expectedCount: 1,
      });
    });
  });

  it("cannot be sent to nobody, and a tick can be put back", async () => {
    vi.mocked(client.getEmailCampaign).mockResolvedValue(ready);
    view();
    for (const box of await screen.findAllByRole("checkbox"))
      await userEvent.click(box);
    expect(await button("0 kişiye gönder")).toBeDisabled();
    await userEvent.click(
      screen.getByRole("checkbox", { name: "Can Üye kişisine gönder" }),
    );
    expect(await button("1 kişiye gönder")).toBeEnabled();
  });

  it("hides the review and stops the sending once the text is edited", async () => {
    vi.mocked(client.getEmailCampaign).mockResolvedValue(ready);
    view();
    await screen.findByRole("table", { name: /alacaklar/ });
    await userEvent.type(screen.getByLabelText("Konu"), "!");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(await button(/kişiye gönder/)).toBeDisabled();
    expect(await button("Kaydet")).toBeEnabled();
  });

  it("asks for a new review when the list changed meanwhile", async () => {
    vi.mocked(client.getEmailCampaign)
      .mockResolvedValueOnce(ready)
      .mockResolvedValue({ ...ready, reviewDigest: null, recipients: [] });
    vi.mocked(client.confirmEmailSend).mockRejectedValue(
      new ClientApiError("Liste değişti", 409, EmailSendRefusal.ListChanged),
    );
    view();
    await userEvent.click(await button("2 kişiye gönder"));
    await userEvent.click(await button("Evet, gönder"));
    expect(await screen.findByText("Liste değişti")).toBeInTheDocument();
    expect(await button("Alıcı listesini göster")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("stays unsent while sending is off", async () => {
    vi.mocked(client.getEmailCampaign).mockResolvedValue(ready);
    vi.mocked(client.getEmailCenterOptions).mockResolvedValue({
      sendingOn: false,
      programs: [program],
    });
    view();
    expect(await button("2 kişiye gönder")).toBeDisabled();
  });

  it("tests, reviews, backs out of sending and deletes", async () => {
    vi.mocked(client.getEmailCampaign).mockResolvedValue(ready);
    vi.mocked(client.sendEmailTest).mockResolvedValue(ready);
    vi.mocked(client.reviewEmailRecipients).mockResolvedValue(ready);
    vi.mocked(client.removeEmailDraft).mockResolvedValue(null);
    view();
    await userEvent.click(await button("Bana test gönder"));
    await waitFor(() => {
      expect(vi.mocked(client.sendEmailTest).mock.calls[0]?.[0]).toBe(
        emailCampaign().id,
      );
    });
    await userEvent.click(await button("Listeyi yenile"));
    await waitFor(() => {
      expect(client.reviewEmailRecipients).toHaveBeenCalled();
    });
    await userEvent.click(await button("2 kişiye gönder"));
    await userEvent.click(await button("Vazgeç"));
    expect(client.confirmEmailSend).not.toHaveBeenCalled();
    await userEvent.click(await button("Taslağı sil"));
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/coordinator/emails");
    });
  });

  it("says why a draft could not be saved", async () => {
    vi.mocked(client.getEmailCampaign).mockResolvedValue(emailDetail());
    vi.mocked(client.saveEmailDraft).mockRejectedValue(new Error("Çok uzun"));
    view();
    await userEvent.type(await screen.findByLabelText("Konu"), "!");
    await userEvent.selectOptions(
      screen.getByLabelText("Alıcılar"),
      EmailAudience.Everyone,
    );
    await userEvent.type(screen.getByLabelText("E-posta metni"), "x");
    await userEvent.click(await button("Kaydet"));
    expect(await screen.findByText("Çok uzun")).toBeInTheDocument();
  });
});

describe("a mail that was sent", () => {
  it("shows what became of each recipient", async () => {
    vi.mocked(client.getEmailCampaign).mockResolvedValue(
      emailDetail({
        campaign: emailCampaign({ status: EmailCampaignStatus.Sent }),
        recipients: [
          emailRecipient({
            status: EmailRecipientStatus.Bounced,
            accountStatus: null,
            address: null,
            teamName: null,
          }),
        ],
      }),
    );
    view();
    expect(await screen.findByText("Geri döndü")).toBeInTheDocument();
    expect(screen.getByText("Hesabı yok")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("shows why it could not be opened", async () => {
    vi.mocked(client.getEmailCampaign).mockRejectedValue(new Error("yok"));
    view();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});

describe("the unsubscribe page", () => {
  it("does nothing until its button is pressed", async () => {
    vi.mocked(client.unsubscribeFromEmails).mockResolvedValue(null);
    renderWithQueryClient(<UnsubscribeView token="abc" />);
    expect(client.unsubscribeFromEmails).not.toHaveBeenCalled();
    await userEvent.click(await button("E-postaları durdur"));
    expect(await screen.findByText(/artık bu e-postaları/)).toBeInTheDocument();
    expect(vi.mocked(client.unsubscribeFromEmails).mock.calls[0]?.[0]).toBe(
      "abc",
    );
  });

  it("says when it failed and when the link is not whole", async () => {
    vi.mocked(client.unsubscribeFromEmails).mockRejectedValue(new Error("x"));
    renderWithQueryClient(<UnsubscribeView token="abc" />);
    await userEvent.click(await button("E-postaları durdur"));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    renderWithQueryClient(<UnsubscribeView token={null} />);
    expect(screen.getByText(/bağlantı geçersiz/)).toBeInTheDocument();
  });
});
