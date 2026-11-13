// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import { createPortal } from "react-dom";

import { AdminOverlay, Panel } from "@/components/admin/admin-ui";
import {
  useDeleteUser,
  useUserDeletion,
  type UserDeletion,
} from "@/hooks/use-delete-user";
import type { DeletablePerson } from "@/lib/user-deletion";

const DESTRUCTIVE_BUTTON =
  "rounded-full border border-[#f3c4b5] px-4 py-2 text-[13px] font-medium text-[#c2410c] hover:bg-[#fff1ec]";

const DELETED_ITEMS = ["account", "profile", "documents"] as const;
const KEPT_ITEMS = ["history", "teams"] as const;

/** The admin's "delete this user" control under a person's profile; absent for admins and for oneself. */
export function DeleteUserSection({ userId }: { userId: string }) {
  const t = useTranslations("adminUsers.deleteUser");
  const deletion = useDeleteUser(userId);
  if (!deletion.person) return null;

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div className="min-w-0 space-y-1">
          <h2 className="text-[15px] font-semibold text-[#22262b]">
            {t("title")}
          </h2>
          <p className="text-[13px] leading-[1.5] text-[#676e78]">
            {t("body")}
          </p>
        </div>
        <button
          type="button"
          onClick={deletion.ask}
          className={DESTRUCTIVE_BUTTON}
        >
          {t("button")}
        </button>
      </div>
      {deletion.confirming ? (
        <DeleteUserDialog person={deletion.person} deletion={deletion} />
      ) : null}
    </Panel>
  );
}

/** The same action in the admin's users drawer, next to "Tüm oturumlarını kapat"; absent where it cannot work. */
export function DeleteUserButton({
  user,
  onDeleted,
}: {
  user: DeletablePerson;
  onDeleted: () => void;
}) {
  const t = useTranslations("adminUsers.deleteUser");
  const deletion = useUserDeletion(user, onDeleted);
  if (!deletion.person) return null;

  return (
    <>
      <button
        type="button"
        onClick={deletion.ask}
        className={DESTRUCTIVE_BUTTON}
      >
        {t("button")}
      </button>
      {deletion.confirming ? (
        <DeleteUserDialog person={deletion.person} deletion={deletion} />
      ) : null}
    </>
  );
}

function DeleteUserDialog({
  person,
  deletion,
}: {
  person: { fullName: string; email: string };
  deletion: UserDeletion;
}) {
  const t = useTranslations("adminUsers.deleteUser");
  const inputId = useId();
  const hintId = useId();

  // Portalled: the users drawer keeps a transform from its slide-in, which would trap a fixed overlay inside it.
  return createPortal(
    <AdminOverlay label={t("dialogTitle")} onClose={deletion.cancel}>
      <form
        className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_16px_48px_rgba(33,38,43,0.14)]"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          if (deletion.canConfirm) deletion.confirm();
        }}
      >
        <h2 className="text-[18px] font-semibold text-[#22262b]">
          {t("dialogTitle")}
        </h2>
        <p className="mt-2 text-[13.5px] leading-[1.5] text-[#676e78]">
          {t("dialogBody", { name: person.fullName })}
        </p>

        <p className="mt-4 text-[13px] font-medium text-[#22262b]">
          {t("deletedHeading")}
        </p>
        <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[13px] leading-[1.5] text-[#676e78]">
          {DELETED_ITEMS.map((item) => (
            <li key={item}>{t(`deleted.${item}`)}</li>
          ))}
        </ul>
        <p className="mt-4 text-[13px] font-medium text-[#22262b]">
          {t("keptHeading")}
        </p>
        <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[13px] leading-[1.5] text-[#676e78]">
          {KEPT_ITEMS.map((item) => (
            <li key={item}>{t(`kept.${item}`)}</li>
          ))}
        </ul>

        <label
          htmlFor={inputId}
          className="mt-5 block text-[13px] font-medium text-[#22262b]"
        >
          {t("emailLabel")}
        </label>
        <p id={hintId} className="mt-1 text-[13px] text-[#676e78]">
          {person.email}
        </p>
        <input
          id={inputId}
          type="email"
          autoComplete="off"
          autoFocus
          value={deletion.typedEmail}
          onChange={(event) => deletion.setTypedEmail(event.target.value)}
          aria-describedby={hintId}
          className="mt-1.5 h-11 w-full rounded-2xl border border-[#e9ecef] px-4 text-[13.5px] text-[#22262b] outline-none focus:border-[#22262b]"
        />

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={deletion.cancel}
            disabled={deletion.pending}
            className="rounded-full border border-[#e9ecef] px-5 py-[11px] text-[13.5px] font-medium text-[#22262b]"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={!deletion.canConfirm}
            className="rounded-full bg-[#c2410c] px-5 py-[11px] text-[13.5px] font-medium text-white disabled:bg-[#aeb4bc]"
          >
            {deletion.pending ? t("deleting") : t("confirm")}
          </button>
        </div>
      </form>
    </AdminOverlay>,
    document.body,
  );
}
