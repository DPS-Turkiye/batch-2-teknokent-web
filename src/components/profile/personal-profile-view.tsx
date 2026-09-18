"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useRef } from "react";

import { PhotoAvatar } from "@/components/common/avatar";
import { AppShell } from "@/components/hoc/app-shell";
import { usePersonalProfilePage } from "@/hooks/use-personal-profile-page";
import { PROFILE_PHOTO_TYPES, ProfileChipTone } from "@/lib/personal-profile";

type PageData = ReturnType<typeof usePersonalProfilePage>;

const CHIP_CLASSES: Record<ProfileChipTone, string> = {
  [ProfileChipTone.Program]: "border-[#f6c9a5] bg-[#fff4ec] text-[#9e4400]",
  [ProfileChipTone.Active]: "border-[#cbebda] bg-[#eefaf3] text-[#0f7a4d]",
  [ProfileChipTone.Neutral]: "border-[#e4e7ea] bg-[#f3f4f6] text-[#4a5059]",
};
// globals.css gives buttons and form fields `font: inherit` outside any layer,
// so their type sizes need `!` to take effect.
const buttonTextClass = "text-[12.5px]! font-medium! leading-[19px]!";
const linkClass = `text-[#9e4400] ${buttonTextClass}`;
const inputClass =
  "mt-1 block w-full rounded-lg border border-[#d4d8dd] px-3 py-2 text-[13px]! text-[#22262b]";
const emptyClass = "text-[12.5px] text-[#858c96]";
const rowClass =
  "flex items-center justify-between gap-4 text-[12.5px] leading-[19px]";

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-[#e4e7ea] bg-white px-5 py-[18px]">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold leading-[23px] text-[#22262b]">
          {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function EditLink({ page, label }: { page: PageData; label: string }) {
  if (page.isEditing) return null;
  return (
    <button
      type="button"
      onClick={page.startEditing}
      aria-label={`${label} düzenle`}
      className={linkClass}
    >
      Düzenle
    </button>
  );
}

function Header({ page }: { page: PageData }) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <header className="flex flex-wrap items-center justify-between gap-5">
      <div className="flex min-w-0 items-center gap-[18px]">
        <div className="relative shrink-0">
          <PhotoAvatar
            initials={page.initials}
            photoUrl={page.photo.photoUrl}
            className="size-[88px] text-[26px]"
            label={`${page.fullName} profil fotoğrafı`}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={page.photo.isUploading}
            aria-label="Profil fotoğrafı yükle"
            className="absolute bottom-0.5 right-[-4px] grid size-6 place-items-center rounded-full disabled:opacity-60"
          >
            <Image
              src="/profile/add-photo.svg"
              alt=""
              width={24}
              height={24}
              className="size-6"
            />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept={PROFILE_PHOTO_TYPES.join(",")}
            aria-label="Profil fotoğrafı dosyası"
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) page.photo.upload(file);
              event.target.value = "";
            }}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="break-words text-[28px] font-semibold leading-[1.5] text-[#22262b]">
            {page.fullName}
          </h1>
          {page.subtitle ? (
            <p className="text-[13.5px] leading-[21px] text-[#676e78]">
              {page.subtitle}
            </p>
          ) : null}
          {page.chips.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {page.chips.map((chip) => (
                <li
                  key={chip.label}
                  className={`rounded-full border px-3 py-[5px] text-xs font-medium leading-[19px] ${CHIP_CLASSES[chip.tone]}`}
                >
                  {chip.label}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {page.isEditing ? (
          <>
            <button
              type="button"
              onClick={page.cancelEditing}
              disabled={page.isSaving}
              className={`rounded-full border border-[#d4d8dd] bg-white px-4 py-2.5 text-[#4a5059] disabled:opacity-50 ${buttonTextClass}`}
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={page.save}
              disabled={!page.canSave}
              className={`rounded-full bg-[#e86f22] px-4 py-2.5 text-white disabled:bg-[#c9cdd2] ${buttonTextClass}`}
            >
              {page.isSaving ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={page.showComingSoon}
              className={`rounded-full border border-[#d4d8dd] bg-white px-4 py-2.5 text-[#4a5059] ${buttonTextClass}`}
            >
              Hesap ayarları
            </button>
            <button
              type="button"
              onClick={page.startEditing}
              className={`rounded-full bg-[#e86f22] px-4 py-2.5 text-white ${buttonTextClass}`}
            >
              Profili düzenle
            </button>
          </>
        )}
      </div>
    </header>
  );
}

function AboutCard({ page }: { page: PageData }) {
  const bio = page.draft?.bio ?? "";
  return (
    <Card title="Hakkımda" action={<EditLink page={page} label="Hakkımda" />}>
      {page.isEditing ? (
        <label className="block text-[11.5px] text-[#676e78]">
          Hakkımda
          <textarea
            value={bio}
            maxLength={5000}
            onChange={(event) => page.setField("bio", event.target.value)}
            className={`${inputClass} min-h-24`}
          />
        </label>
      ) : (
        <p className="whitespace-pre-line text-[13px] leading-5 text-[#4a5059]">
          {bio || "Henüz hakkında bilgisi eklenmedi."}
        </p>
      )}
    </Card>
  );
}

function StartupCard({ page }: { page: PageData }) {
  if (!page.startup) return null;
  const { startup } = page;
  return (
    <Card
      title="Startup’ım"
      action={
        <Link href="/startup" className={linkClass}>
          Startup profiline git →
        </Link>
      }
    >
      <div className="flex items-center gap-3">
        {startup.logoUrl ? (
          <span
            role="img"
            aria-label={`${startup.name} logosu`}
            className="size-10 shrink-0 rounded-[10px] border border-[#e4e7ea] bg-contain bg-center bg-no-repeat"
            style={{ backgroundImage: `url("${startup.logoUrl}")` }}
          />
        ) : (
          <span
            aria-hidden
            className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[#eef7f0] text-[13px] font-semibold text-[#3f7d5a]"
          >
            {startup.initials}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-[14px] font-medium leading-[22px] text-[#22262b]">
            {startup.name}
          </p>
          {startup.summary ? (
            <p className="truncate text-[12px] leading-[19px] text-[#676e78]">
              {startup.summary}
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function MentorshipsCard({ page }: { page: PageData }) {
  return (
    <Card
      title="Aktif mentorluklarım"
      action={
        <Link href="/mentorships" className={linkClass}>
          Tümü →
        </Link>
      }
    >
      {page.mentorshipsLoading ? (
        <p className={emptyClass}>Yükleniyor...</p>
      ) : page.mentorships.length === 0 ? (
        <p className={emptyClass}>Henüz aktif bir mentorluğun yok.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {page.mentorships.map((row) => (
            <li key={row.id}>
              <Link
                href={row.href}
                className="flex items-center justify-between gap-3 rounded-lg border border-[#e4e7ea] px-3.5 py-3 hover:bg-[#fcfcfd]"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden
                    className="grid size-[34px] shrink-0 place-items-center rounded-full bg-[#fbe2d0] text-[11px] font-semibold text-[#c95c18]"
                  >
                    {row.initials}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium leading-5 text-[#22262b]">
                      {row.mentorName}
                    </span>
                    <span className="block truncate text-[11.5px] leading-[18px] text-[#676e78]">
                      {row.detail}
                    </span>
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {row.status ? (
                    <span className="text-[11.5px] font-medium leading-[18px] text-[#9e4400]">
                      {row.status}
                    </span>
                  ) : null}
                  <Image
                    src="/profile/chevron-right.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="size-4"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function ContactCard({ page }: { page: PageData }) {
  return (
    <Card title="İletişim" action={<EditLink page={page} label="İletişim" />}>
      {page.isEditing && page.draft ? (
        <div className="flex flex-col gap-3">
          <label className="block text-[11.5px] text-[#676e78]">
            Ad soyad
            <input
              value={page.draft.fullName}
              maxLength={255}
              aria-invalid={Boolean(page.fieldErrors.fullName)}
              onChange={(event) =>
                page.setField("fullName", event.target.value)
              }
              className={inputClass}
            />
          </label>
          {page.fieldErrors.fullName ? (
            <p role="alert" className="text-[11.5px] text-[#b3261e]">
              {page.fieldErrors.fullName}
            </p>
          ) : null}
          <label className="block text-[11.5px] text-[#676e78]">
            Rol
            <input
              value={page.draft.jobTitle ?? ""}
              maxLength={255}
              onChange={(event) =>
                page.setField("jobTitle", event.target.value)
              }
              className={inputClass}
            />
          </label>
        </div>
      ) : (
        <dl className="flex flex-col gap-3">
          <div className={rowClass}>
            <dt className="text-[12px] text-[#676e78]">E-posta</dt>
            <dd className="text-right font-medium text-[#4a5059]">
              {page.email || "—"}
            </dd>
          </div>
          <div className={rowClass}>
            <dt className="text-[12px] text-[#676e78]">Rol</dt>
            <dd className="text-right font-medium text-[#4a5059]">
              {page.role || "—"}
            </dd>
          </div>
        </dl>
      )}
    </Card>
  );
}

function AccountCard({ page }: { page: PageData }) {
  return (
    <Card title="Hesap">
      <dl className="flex flex-col gap-3">
        <div className={rowClass}>
          <dt className="text-[#4a5059]">Bildirimler</dt>
          <dd className="text-[12px] text-[#858c96]">Uygulama içi</dd>
        </div>
        <div className={rowClass}>
          <dt className="text-[#4a5059]">Takvim senkronu</dt>
          <dd className="text-[12px] text-[#858c96]">Bağlı değil</dd>
        </div>
        <div className={rowClass}>
          <dt className="text-[#4a5059]">Şifre</dt>
          <dd>
            <button
              type="button"
              onClick={() => void page.sendPasswordReset()}
              disabled={page.isSendingReset || !page.email}
              className="text-[12px]! font-medium! leading-[19px]! text-[#9e4400] disabled:opacity-50"
            >
              {page.isSendingReset
                ? "Gönderiliyor…"
                : "Sıfırlama e-postası gönder"}
            </button>
          </dd>
        </div>
      </dl>
    </Card>
  );
}

export function PersonalProfileView() {
  const page = usePersonalProfilePage();

  return (
    <AppShell menteeHome>
      {page.isLoading ? (
        <p className="p-10 text-center text-sm text-[#858c96]">Yükleniyor...</p>
      ) : page.loadError || !page.draft ? (
        <p className="p-10 text-center text-sm text-[#b3261e]">
          {page.loadError ?? "Profil yüklenemedi."}
        </p>
      ) : (
        <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-[22px] px-4 pb-[72px] pt-3 sm:px-8 xl:px-[106px]">
          <Header page={page} />
          {page.saveError ? (
            <p role="alert" className="text-[12px] text-[#b3261e]">
              {page.saveError}
            </p>
          ) : null}
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
            <div className="flex flex-col gap-[18px]">
              <AboutCard page={page} />
              <StartupCard page={page} />
              <MentorshipsCard page={page} />
            </div>
            <aside className="flex flex-col gap-[18px]">
              <ContactCard page={page} />
              <AccountCard page={page} />
            </aside>
          </div>
        </main>
      )}
    </AppShell>
  );
}
