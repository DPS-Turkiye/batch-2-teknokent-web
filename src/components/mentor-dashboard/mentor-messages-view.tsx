"use client";

import {
  ChevronRight,
  Download,
  Mail,
  Paperclip,
  Search,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/hoc/app-shell";
import { AppArea } from "@/types/app-area";

const conversations = [
  {
    initials: "GB",
    name: "Gülse Buran",
    time: "10:24",
    context: "Döngü · Product & UX Design",
    preview: "Yeni prototipi yükledim, matc...",
    unread: 2,
  },
  {
    initials: "EK",
    name: "Emir Kaplan",
    time: "Dün",
    context: "Atlas AI · Product Discovery",
    preview: "Research notlarını ekledik, bakabilir...",
  },
  {
    initials: "DA",
    name: "Deniz Arslan",
    time: "7 Eyl",
    context: "NovaTech · Design System",
    preview: "Token isimlendirmesi için bir sorum...",
  },
  {
    initials: "TY",
    name: "Türkan Yalçın",
    time: "5 Eyl",
    context: "METU Stars · Koordinatör",
    preview: "Mentor buluşması Cuma günü 16:00.",
  },
];

function ConversationList({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (name: string) => void;
}) {
  const [search, setSearch] = useState("");
  const shown = useMemo(
    () =>
      conversations.filter((c) =>
        [c.name, c.context, c.preview]
          .join(" ")
          .toLocaleLowerCase("tr-TR")
          .includes(search.toLocaleLowerCase("tr-TR")),
      ),
    [search],
  );
  return (
    <aside className="overflow-hidden rounded-[12px] border border-[#e4e7ea] bg-white">
      <div className="h-[100px] px-4 pt-4">
        <h2 className="text-[15px] font-semibold">Konuşmalar</h2>
        <label className="mt-3 flex h-[37px] items-center gap-2 rounded-lg border border-[#e4e7ea] bg-[#f6f7f9] px-3">
          <Search className="size-[15px] text-[#676e78]" strokeWidth={1.6} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-[#858c96]"
            placeholder="Mentee veya startup ara"
          />
        </label>
      </div>
      <ul>
        {shown.map((c) => (
          <li key={c.name} className="border-t border-[#eef0f3]">
            <button
              onClick={() => onSelect(c.name)}
              className={`flex h-[85px] w-full gap-3 px-4 py-3 text-left ${selected === c.name ? "bg-[#f2f8fc]" : "hover:bg-[#fafbfc]"}`}
            >
              <span
                className={`grid size-[34px] shrink-0 place-items-center rounded-full text-[10px] font-medium ${selected === c.name ? "bg-[#e7f5ff] text-[#26a4ff]" : "bg-[#f3f4f6] text-[#676e78]"}`}
              >
                {c.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex justify-between">
                  <b className="text-[13px] font-semibold">{c.name}</b>
                  <span className="text-[10px] text-[#858c96]">{c.time}</span>
                </span>
                <span className="mt-0.5 block truncate text-[10.5px] text-[#676e78]">
                  {c.context}
                </span>
                <span className="mt-1 flex items-center justify-between">
                  <span className="truncate text-[10.5px] text-[#858c96]">
                    {c.preview}
                  </span>
                  {c.unread ? (
                    <b className="ml-2 grid size-5 shrink-0 place-items-center rounded-full bg-[#26a4ff] text-[10px] text-white">
                      {c.unread}
                    </b>
                  ) : null}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function EmptyConversation({ onSelect }: { onSelect: () => void }) {
  return (
    <section className="grid min-h-[341px] place-items-center rounded-[12px] border border-[#e4e7ea] bg-white text-center">
      <div>
        <Mail className="mx-auto size-9" strokeWidth={1.3} />
        <h2 className="mt-3 text-base font-semibold">Bir konuşma seç</h2>
        <p className="mx-auto mt-3 max-w-[360px] text-[12px] leading-5 text-[#676e78]">
          Soldaki listeden bir mentee seçtiğinde ilgili mentorluk bağlamı da
          burada görünür.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={onSelect}
            className="rounded-full bg-[#26a4ff] px-4 py-2.5 text-[12.5px] text-white"
          >
            Yeni mesaj başlat
          </button>
          <button className="rounded-full border border-[#d4d8dd] px-4 py-2.5 text-[12.5px]">
            Dosya iste
          </button>
        </div>
      </div>
    </section>
  );
}

const messages = [
  {
    author: "Gülse",
    text: "Yeni onboarding akışını ve son test notlarını yükledim. Matching değerini nasıl anlattığımızı konuşmak istiyorum.",
    time: "09:58",
    own: false,
  },
  {
    author: "Nihan",
    text: "Baktım. İki izlenimim var: ilan platformu algısı hâlâ güçlü, ve ilk ekranda kullanıcıya ne vaat ettiğimiz net değil.",
    time: "10:06",
    own: true,
  },
  {
    author: "Nihan",
    text: "Görüşmede ikisini de netleştirelim. Öncesinde revize prototipi paylaşabilir misin?",
    time: "10:07",
    own: true,
  },
  {
    author: "Gülse",
    text: "Tabii, yarın akşama kadar yüklerim.",
    time: "10:24",
    own: false,
  },
];

function ActiveConversation() {
  return (
    <section className="overflow-hidden rounded-[12px] border border-[#e4e7ea] bg-white">
      <header className="flex h-[75px] items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <span className="grid size-[38px] place-items-center rounded-full bg-[#e7f5ff] text-[10px] font-medium text-[#26a4ff]">
            GB
          </span>
          <div>
            <h2 className="text-[15px] font-semibold">Gülse Buran</h2>
            <p className="mt-0.5 text-[11px] text-[#676e78]">
              Döngü · Product & UX Design
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-full border border-[#d4d8dd] px-4 py-2.5 text-[12.5px]">
            Dosya iste
          </button>
          <button className="rounded-full border border-[#d4d8dd] px-4 py-2.5 text-[12.5px]">
            Toplantı planla
          </button>
          <ChevronRight className="size-[18px]" strokeWidth={1.5} />
        </div>
      </header>
      <div className="border-t border-[#eef0f3] px-5 pb-[18px] pt-[18px]">
        <div className="flex h-[62px] items-center justify-between rounded-lg bg-[#f2f8fc] px-4">
          <div>
            <p className="text-[10px] font-semibold uppercase text-[#26a4ff]">
              İlgili mentorluk · Döngü
            </p>
            <p className="mt-1 text-[12px] text-[#4a5059]">
              2 açık iş · 1 bekleyen dosya · Sonraki görüşme 14 Eyl · 14:00
            </p>
          </div>
          <button className="text-[12px] font-medium text-[#26a4ff]">
            Mentorluk detayına git →
          </button>
        </div>
        <p className="mt-4 text-[10.5px] text-[#858c96]">Bugün</p>
        <div className="mt-4 space-y-4">
          {messages.map((message, index) => (
            <article
              key={index}
              className={`flex flex-col ${message.own ? "items-end" : "items-start"}`}
            >
              <div
                className={`w-full max-w-[468px] rounded-xl px-3.5 py-3 text-[12px] leading-5 ${message.own ? "bg-[#f2f8fc]" : "border border-[#e4e7ea] bg-[#f6f7f9]"}`}
              >
                <p
                  className={`mb-1 text-[10.5px] font-medium ${message.own ? "text-[#26a4ff]" : "text-[#858c96]"}`}
                >
                  {message.author}
                </p>
                <p>{message.text}</p>
              </div>
              <time className="mt-1 text-[9.5px] text-[#858c96]">
                {message.time}
              </time>
            </article>
          ))}
        </div>
        <div className="mt-4 flex h-[63px] items-center justify-between rounded-lg border border-[#e4e7ea] px-3.5">
          <div className="flex items-center gap-3">
            <Paperclip className="size-4" strokeWidth={1.5} />
            <div>
              <p className="text-[12px] font-medium">onboarding-v4.fig</p>
              <p className="mt-0.5 text-[10.5px] text-[#858c96]">
                Gülse tarafından paylaşıldı · 8,2 MB
              </p>
            </div>
          </div>
          <Download className="size-4" strokeWidth={1.5} />
        </div>
        <div className="mt-3 flex h-[63px] items-center rounded-lg border border-[#e4e7ea] px-3.5">
          <input
            className="min-w-0 flex-1 text-[12px] outline-none placeholder:text-[#858c96]"
            placeholder="Mesaj yaz…"
          />
          <Upload className="mr-3 size-[18px]" strokeWidth={1.5} />
          <button className="rounded-full bg-[#26a4ff] px-4 py-2.5 text-[12.5px] text-white">
            Gönder
          </button>
        </div>
      </div>
    </section>
  );
}

export function MentorMessagesView() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <AppShell active={AppArea.Meetings} mentorHome>
      <main className="mx-auto w-full max-w-[1276px] px-6 pb-[72px] pt-3">
        <header>
          <h1 className="text-[28px] font-semibold leading-[42px]">Mesajlar</h1>
          <p className="mt-1 text-[13px] text-[#676e78]">
            Mentee ve koordinatörlerle konuşurken mentorluk bağlamını kaybetme.
          </p>
        </header>
        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[340px_minmax(0,868px)]">
          <ConversationList selected={selected} onSelect={setSelected} />
          {selected ? (
            <ActiveConversation />
          ) : (
            <EmptyConversation onSelect={() => setSelected("Gülse Buran")} />
          )}
        </div>
      </main>
    </AppShell>
  );
}
