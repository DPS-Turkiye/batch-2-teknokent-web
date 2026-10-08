"use client";

import Image from "next/image";
import Link from "next/link";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";

import { PhotoAvatar } from "@/components/common/avatar";
import { SUPPORT_EMAIL } from "@/lib/const";

const itemClass =
  "flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[12.5px]! font-normal! leading-[19px]! text-[#4a5059] hover:bg-[#f8f9fa] focus-visible:bg-[#f8f9fa] focus-visible:outline-none";
const MENU_ITEM = '[role="menuitem"]';

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
  onOpenSettings,
  onOpenNotifications,
  onLogout,
}: {
  displayName: string;
  subtitle: string;
  email: string;
  initials: string;
  photoUrl: string | null;
  profileHref: string;
  showName: boolean;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>(MENU_ITEM)?.focus();
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const closeAndRefocus = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };
  // Focus goes back to the trigger first, so the dialog returns it there on close.
  const openDialog = (show: () => void) => {
    closeAndRefocus();
    show();
  };

  // The menu-button pattern: arrow keys, Home and End move between items; Tab leaves.
  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Tab") {
      setOpen(false);
      return;
    }
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>(MENU_ITEM) ?? [],
    );
    const current = items.indexOf(document.activeElement as HTMLElement);
    const moves: Record<string, number> = {
      ArrowDown: (current + 1) % items.length,
      ArrowUp: (current - 1 + items.length) % items.length,
      Home: 0,
      End: items.length - 1,
    };
    const next = moves[event.key];
    if (next === undefined || items.length === 0) return;
    event.preventDefault();
    items[next].focus();
  }

  return (
    <div ref={containerRef} className="relative hidden sm:block">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`${displayName} · Hesap menüsünü aç`}
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left hover:border-[#e4e7ea]"
      >
        <PhotoAvatar
          initials={initials}
          photoUrl={photoUrl}
          className="size-[30px] text-[10.8px]"
          decorative
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
      </button>
      {open ? (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Hesap menüsü"
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 top-12 z-50 w-[264px] overflow-hidden rounded-[20px] border border-[#e4e7ea] bg-white shadow-[0_12px_36px_rgba(0,0,0,0.16)]"
        >
          <div className="flex items-center gap-2.5 px-4 py-3.5">
            <PhotoAvatar
              initials={initials}
              photoUrl={photoUrl}
              className="size-[34px] text-[11px]"
              decorative
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
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className={itemClass}
          >
            <ItemIcon src="/account-menu/user.svg" />
            Profilim
          </Link>
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            onClick={() => openDialog(onOpenSettings)}
            className={itemClass}
          >
            <ItemIcon src="/account-menu/settings.svg" />
            Hesap ayarları
          </button>
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            onClick={() => openDialog(onOpenNotifications)}
            className={itemClass}
          >
            <ItemIcon src="/account-menu/bell.svg" />
            Bildirim tercihleri
          </button>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            role="menuitem"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className={itemClass}
          >
            <ItemIcon src="/account-menu/search.svg" />
            Yardım &amp; destek
          </a>
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            onClick={() => {
              setOpen(false);
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
