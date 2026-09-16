"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { PhotoAvatar } from "@/components/common/avatar";

const itemClass =
  "flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[12.5px] leading-[19px] text-[#4a5059] hover:bg-[#f8f9fa] focus-visible:bg-[#f8f9fa] focus-visible:outline-none";

function ItemIcon({ src }: { src: string }) {
  return (
    <Image
      src={src}
      alt=""
      width={16}
      height={16}
      className="size-4 shrink-0"
    />
  );
}

/** The account dropdown behind the avatar in the top bar, for every role. */
export function AccountMenu({
  displayName,
  subtitle,
  email,
  initials,
  photoUrl,
  profileHref,
  showName,
  onComingSoon,
  onLogout,
}: {
  displayName: string;
  subtitle: string;
  email: string;
  initials: string;
  photoUrl: string | null;
  profileHref: string;
  showName: boolean;
  onComingSoon: () => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);
  const comingSoon = () => {
    close();
    onComingSoon();
  };

  return (
    <div ref={containerRef} className="relative hidden sm:block">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left hover:border-[#e4e7ea]"
      >
        <PhotoAvatar
          initials={initials}
          photoUrl={photoUrl}
          className="size-[30px] text-[10.8px]"
        />
        {showName ? (
          <span className="max-w-28 leading-tight">
            <strong className="block truncate text-xs font-semibold">
              {displayName}
            </strong>
            <span className="block truncate text-[10px] text-[#858c96]">
              {subtitle}
            </span>
          </span>
        ) : null}
        <Image
          src="/account-menu/dropdown.svg"
          alt=""
          width={24}
          height={24}
          className={`size-6 transition-transform ${open ? "rotate-180" : ""}`}
        />
        <span className="sr-only">
          {showName
            ? "Hesap menüsünü aç"
            : `${displayName} · Hesap menüsünü aç`}
        </span>
      </button>
      {open ? (
        <div
          role="menu"
          aria-label="Hesap menüsü"
          className="absolute right-0 top-12 z-50 w-[264px] overflow-hidden rounded-[20px] border border-[#e4e7ea] bg-white shadow-[0_12px_36px_rgba(0,0,0,0.16)]"
        >
          <div className="flex items-center gap-2.5 px-4 py-3.5">
            <PhotoAvatar
              initials={initials}
              photoUrl={photoUrl}
              className="size-[34px] text-[11px]"
            />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium leading-5 text-[#22262b]">
                {displayName}
              </p>
              {email ? (
                <p className="truncate text-[11.5px] leading-[17px] text-[#676e78]">
                  {email}
                </p>
              ) : null}
            </div>
          </div>
          <div role="separator" className="h-px bg-[#eceef0]" />
          <Link
            href={profileHref}
            role="menuitem"
            onClick={close}
            className={itemClass}
          >
            <ItemIcon src="/account-menu/user.svg" />
            Profilim
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={comingSoon}
            className={itemClass}
          >
            <ItemIcon src="/account-menu/settings.svg" />
            Hesap ayarları
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={comingSoon}
            className={itemClass}
          >
            <ItemIcon src="/account-menu/bell.svg" />
            Bildirim tercihleri
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={comingSoon}
            className={itemClass}
          >
            <ItemIcon src="/account-menu/search.svg" />
            Yardım &amp; destek
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              close();
              onLogout();
            }}
            className={`${itemClass} text-[#b3261e]`}
          >
            <ItemIcon src="/account-menu/expand-right.svg" />
            Çıkış yap
          </button>
        </div>
      ) : null}
    </div>
  );
}
