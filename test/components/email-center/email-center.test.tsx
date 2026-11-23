import { QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EmailComposeForm } from "@/components/email-center/email-compose-form";
import { EmailTemplatesView } from "@/components/email-center/email-templates-view";
import { EmailView } from "@/components/email-center/email-view";
import { EmailsView } from "@/components/email-center/emails-view";
import { NewEmailView } from "@/components/email-center/new-email-view";
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
import {
  createTestQueryClient,
  InLocale,
  renderWithQueryClient,
} from "@test/test-utils";

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
    expect(link).toHaveTextContent("Gönderim tamamlandı");
    expect(screen.getByRole("link", { name: "Şablonlar" })).toHaveAttribute(
      "href",
      "/admin/emails/templates",
    );
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
    const list = await screen.findByRole("region", {
      name: /alacaklar \(2\)/,
    });
    expect(within(list).getByText("ayse@example.test")).toBeInTheDocument();
    const out = screen.getByRole("region", { name: /Almayacaklar \(1\)/ });
    expect(
      within(out).getByText("E-posta almak istemiyor"),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("checkbox", { name: "Can Üye kişisine gönder" }),
    );
    await userEvent.click(await button("1 kişiye gönder"));
    expect(client.confirmEmailSend).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog", {
      name: "1 kişiye gönderilsin mi?",
    });
    for (const fact of [
      "Build '26",
      "Katılımcılar",
      "1 kişi",
      "elif@example.test",
    ])
      expect(within(dialog).getByText(fact)).toBeInTheDocument();
    await userEvent.click(await button("Evet, gönder"));
    await waitFor(() => {
      expect(client.confirmEmailSend).toHaveBeenCalledWith(emailCampaign().id, {
        reviewDigest: "digest-1",
        untickedIds: ["r2"],
        expectedCount: 1,
      });
    });
  });

  it("is looked through without changing who gets it", async () => {
    vi.mocked(client.getEmailCampaign).mockResolvedValue(ready);
    view();
    const list = await screen.findByRole("region", {
      name: /alacaklar \(2\)/,
    });
    const search = within(list).getByRole("textbox");
    await userEvent.type(search, "CAN");
    expect(within(list).getAllByRole("checkbox")).toHaveLength(1);
    expect(await button("2 kişiye gönder")).toBeEnabled();
    await userEvent.type(search, "xyz");
    expect(
      within(list).getByText("Aramana uyan kimse yok."),
    ).toBeInTheDocument();
  });

  it("shows which step is next", async () => {
    vi.mocked(client.getEmailCampaign).mockResolvedValue(emailDetail());
    view();
    const steps = await screen.findAllByRole("listitem");
    expect(steps.map((step) => step.getAttribute("aria-current"))).toEqual([
      null,
      "step",
      null,
      null,
    ]);
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
    await screen.findByRole("region", { name: /alacaklar/ });
    await userEvent.type(screen.getByLabelText("Konu"), "!");
    expect(
      screen.queryByRole("region", { name: /alacaklar/ }),
    ).not.toBeInTheDocument();
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
    expect(client.removeEmailDraft).not.toHaveBeenCalled();
    await userEvent.click(await button("Evet, sil"));
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/coordinator/emails");
    });
  });

  it("creates one draft however often Kaydet is pressed", async () => {
    vi.mocked(client.saveEmailDraft).mockResolvedValue(emailDetail());
    renderWithQueryClient(
      <EmailComposeForm detail={null} basePath={EmailCenterPath.Coordinator} />,
    );
    await screen.findByRole("option", { name: "Build '26" });
    await userEvent.selectOptions(screen.getByLabelText("Program"), program.id);
    await userEvent.type(screen.getByLabelText("Konu"), "Konu");
    await userEvent.type(screen.getByLabelText("E-posta metni"), "x");
    const save = await button("Kaydet");
    await userEvent.click(save);
    await waitFor(() => {
      expect(replace).toHaveBeenCalled();
    });
    expect(save).toBeDisabled();
    await userEvent.click(save);
    expect(client.saveEmailDraft).toHaveBeenCalledTimes(1);
  });

  it("asks before a template replaces what was written", async () => {
    vi.mocked(client.getEmailCampaign).mockResolvedValue(emailDetail());
    view();
    await screen.findByRole("option", { name: "Davet hatırlatması" });
    const choose = () =>
      userEvent.selectOptions(
        screen.getByLabelText("Şablon"),
        "inviteReminder",
      );
    await choose();
    await userEvent.click(await button("Vazgeç"));
    expect(screen.getByLabelText("Konu")).toHaveValue("Duyuru konusu");
    await choose();
    await userEvent.click(await button("Evet, şablonu kullan"));
    expect(screen.getByLabelText("Konu")).toHaveValue("Kaydını tamamla");
  });

  it("starts with everybody ticked again when the list was renewed", async () => {
    vi.mocked(client.getEmailCampaign).mockResolvedValue(ready);
    vi.mocked(client.reviewEmailRecipients).mockResolvedValue({
      ...ready,
      reviewDigest: "digest-2",
    });
    view();
    await userEvent.click(
      await screen.findByRole("checkbox", { name: "Can Üye kişisine gönder" }),
    );
    expect(await button("1 kişiye gönder")).toBeEnabled();
    await userEvent.click(await button("Listeyi yenile"));
    expect(await button("2 kişiye gönder")).toBeEnabled();
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

describe("the templates", () => {
  const templates = () =>
    renderWithQueryClient(
      <EmailTemplatesView basePath={EmailCenterPath.Coordinator} />,
    );
  const start = (programId: string, templateKey: string) =>
    renderWithQueryClient(
      <NewEmailView
        basePath={EmailCenterPath.Coordinator}
        programId={programId}
        templateKey={templateKey}
      />,
    );

  it("shows each one's name, subject and text and leads to a new mail", async () => {
    templates();
    expect(
      await screen.findByRole("heading", { name: "Davet hatırlatması" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Konu: Kaydını tamamla")).toBeInTheDocument();
    expect(
      await screen.findByRole("document", {
        name: "Davet hatırlatması önizlemesi",
      }),
    ).toHaveTextContent("Hatırlatma");
    expect(
      screen.getByRole("link", {
        name: "Bu şablonu kullan: Davet hatırlatması",
      }),
    ).toHaveAttribute(
      "href",
      `/coordinator/emails/new?program=${program.id}&template=inviteReminder`,
    );
  });

  it("shows another program's when it is picked", async () => {
    vi.mocked(client.getEmailCenterOptions).mockResolvedValue({
      sendingOn: true,
      programs: [program, { id: "p2", name: "Growth" }],
    });
    templates();
    await screen.findByRole("heading", { name: "Davet hatırlatması" });
    await userEvent.selectOptions(screen.getByLabelText("Program"), "p2");
    await waitFor(() => {
      expect(client.getEmailTemplates).toHaveBeenLastCalledWith("p2");
    });
  });

  it("says when there is no program, and why they could not be loaded", async () => {
    vi.mocked(client.getEmailCenterOptions).mockResolvedValue({
      sendingOn: true,
      programs: [],
    });
    const { unmount } = templates();
    expect(
      await screen.findByText(/Yönettiğin bir program olunca/),
    ).toBeInTheDocument();
    expect(client.getEmailTemplates).not.toHaveBeenCalled();
    unmount();
    vi.mocked(client.getEmailCenterOptions).mockRejectedValue(new Error("x"));
    templates();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  it("fills a new, unsaved mail with the chosen one", async () => {
    start(program.id, "inviteReminder");
    expect(await screen.findByLabelText("Konu")).toHaveValue("Kaydını tamamla");
    expect(screen.getByLabelText("Alıcılar")).toHaveValue(
      EmailAudience.Unjoined,
    );
    expect(screen.getByLabelText("E-posta metni")).toHaveValue(
      "<p>Hatırlatma</p>",
    );
    expect(client.saveEmailDraft).not.toHaveBeenCalled();
    expect(await button("Kaydet")).toBeEnabled();
  });

  it("starts over when another template, or none, is asked for", async () => {
    const queryClient = createTestQueryClient();
    const at = (templateKey: string) => (
      <InLocale locale="tr">
        <QueryClientProvider client={queryClient}>
          <NewEmailView
            basePath={EmailCenterPath.Coordinator}
            programId={templateKey ? program.id : ""}
            templateKey={templateKey}
          />
        </QueryClientProvider>
      </InLocale>
    );
    const { rerender } = render(at("inviteReminder"));
    expect(await screen.findByLabelText("Konu")).toHaveValue("Kaydını tamamla");
    rerender(at(""));
    expect(screen.getByLabelText("Konu")).toHaveValue("");
  });

  it("keeps what is being written when a later refetch fails", async () => {
    const queryClient = createTestQueryClient();
    render(
      <InLocale locale="tr">
        <QueryClientProvider client={queryClient}>
          <NewEmailView
            basePath={EmailCenterPath.Coordinator}
            programId={program.id}
            templateKey="inviteReminder"
          />
        </QueryClientProvider>
      </InLocale>,
    );
    await userEvent.type(await screen.findByLabelText("Konu"), "!");
    vi.mocked(client.getEmailTemplates).mockRejectedValue(new Error("yok"));
    await act(() => queryClient.refetchQueries());
    expect(screen.getByLabelText("Konu")).toHaveValue("Kaydını tamamla!");
  });

  it("starts empty without one, or with one that does not exist", async () => {
    const { unmount } = start("", "");
    expect(await screen.findByLabelText("Konu")).toHaveValue("");
    expect(client.getEmailTemplates).not.toHaveBeenCalled();
    unmount();
    start(program.id, "unknown");
    expect(await screen.findByLabelText("Konu")).toHaveValue("");
    await screen.findByRole("option", { name: "Build '26" });
    expect(screen.getByLabelText("Program")).toHaveValue(program.id);
  });

  it("says why the chosen one could not be loaded", async () => {
    vi.mocked(client.getEmailTemplates).mockRejectedValue(new Error("yok"));
    start("somebody-elses", "inviteReminder");
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByLabelText("Konu")).not.toBeInTheDocument();
  });
});

describe("a mail that was sent", () => {
  it("shows what became of each recipient", async () => {
    vi.mocked(client.getEmailCampaign).mockResolvedValue(
      emailDetail({
        campaign: emailCampaign({
          status: EmailCampaignStatus.Sent,
          counts: { [EmailRecipientStatus.Bounced]: 1 },
        }),
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
    const missed = await screen.findByRole("region", {
      name: "Ulaşmayanlar (1)",
    });
    expect(within(missed).getByText("Geri döndü")).toBeInTheDocument();
    expect(within(missed).getByText("Hesabı yok")).toBeInTheDocument();
    expect(within(missed).getByText("Adres yok")).toBeInTheDocument();
    const log = screen.getByRole("region", { name: "Gönderim durumu" });
    await userEvent.click(
      within(log).getByRole("button", { name: "Gönderilen" }),
    );
    expect(
      within(log).getByText("Aramana uyan kimse yok."),
    ).toBeInTheDocument();
    await userEvent.click(
      within(log).getByRole("button", { name: "Ulaşmayan" }),
    );
    expect(within(log).getByText("Ayşe Kurucu")).toBeInTheDocument();
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
