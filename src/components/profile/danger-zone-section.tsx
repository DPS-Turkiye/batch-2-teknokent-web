// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import { createPortal } from "react-dom";

import { AdminOverlay } from "@/components/admin/admin-ui";
import { ProfileCard } from "@/components/profile/profile-card";
import {
  useAccountDeletion,
  type AccountDeletion,
} from "@/hooks/use-account-deletion";
import { AccountDeletionBlock } from "@/interfaces/self-deletion";
import { ACCOUNT_CONFIRMATION_WORD } from "@/lib/self-deletion";
import { DeletionStep, DeletionTarget } from "@/types/self-deletion";

const ROW_BUTTON =
  "shrink-0 rounded-full border border-[#f3c4b5] px-4 py-2 text-[13px] font-medium text-[#c2410c] hover:bg-[#fff1ec] disabled:cursor-not-allowed disabled:border-[#e9ecef] disabled:text-[#aeb4bc] disabled:hover:bg-transparent";
const SECONDARY_BUTTON =
  "rounded-full border border-[#e9ecef] px-5 py-[11px] text-[13.5px] font-medium text-[#22262b] disabled:opacity-50";
const DESTRUCTIVE_BUTTON =
  "rounded-full bg-[#c2410c] px-5 py-[11px] text-[13.5px] font-medium text-white disabled:bg-[#aeb4bc]";

const ERASED = {
  [DeletionTarget.Account]: [
    "account.erased.profile",
    "account.erased.files",
    "account.erased.login",
    "account.erased.notifications",
  ],
  [DeletionTarget.Startup]: [
    "startup.erased.profile",
    "startup.erased.files",
    "startup.erased.programs",
    "startup.erased.process",
  ],
} as const;
const KEPT = {
  [DeletionTarget.Account]: ["account.kept.history", "account.kept.requests"],
  [DeletionTarget.Startup]: [
    "startup.kept.members",
    "startup.kept.history",
    "startup.kept.open",
  ],
} as const;

/** "Tehlikeli bölge" under the profile: deleting one's own account, and a founder's startup. */
export function DangerZoneSection() {
  const t = useTranslations("dangerZone");
  const deletion = useAccountDeletion();
  if (deletion.hidden) return null;
  const blocked = deletion.accountBlockedReason;

  return (
    <ProfileCard title={t("title")}>
      <p className="text-[13px] leading-[1.5] text-[#676e78]">{t("intro")}</p>
      {deletion.startup ? (
        <Row
          title={t("startup.title")}
          body={t("startup.body", { name: deletion.startup.name })}
          button={t("startup.button")}
          onClick={() => deletion.open(DeletionTarget.Startup)}
        />
      ) : null}
      {deletion.accountOffered ? (
        <Row
          title={t("account.title")}
          body={
            blocked === AccountDeletionBlock.Founder
              ? t("account.blockedFounder")
              : blocked === AccountDeletionBlock.Institution
                ? t("account.blockedInstitution")
                : t("account.body")
          }
          button={t("account.button")}
          disabled={blocked !== null}
          onClick={() => deletion.open(DeletionTarget.Account)}
        />
      ) : null}
      {deletion.dialog ? (
        <DeletionDialog deletion={deletion} target={deletion.dialog.target} />
      ) : null}
    </ProfileCard>
  );
}

function Row({
  title,
  body,
  button,
  disabled = false,
  onClick,
}: {
  title: string;
  body: string;
  button: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f1f3f5] pt-3">
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="text-[13.5px] font-semibold text-[#22262b]">{title}</h3>
        <p className="text-[12.5px] leading-[1.5] text-[#676e78]">{body}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={ROW_BUTTON}
      >
        {button}
      </button>
    </div>
  );
}

type StepProps = { deletion: AccountDeletion; target: DeletionTarget };

function DeletionDialog({ deletion, target }: StepProps) {
  const t = useTranslations("dangerZone");
  const step = deletion.dialog?.step;

  // Portalled, so the card's layout can never trap the fixed overlay inside it.
  return createPortal(
    <AdminOverlay label={t(`${target}.dialogTitle`)} onClose={deletion.cancel}>
      <div
        className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_16px_48px_rgba(33,38,43,0.14)]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-[18px] font-semibold text-[#22262b]">
          {t(`${target}.dialogTitle`)}
        </h2>
        {step === DeletionStep.Explain ? (
          <ExplainStep deletion={deletion} target={target} />
        ) : step === DeletionStep.Confirm ? (
          <ConfirmStep deletion={deletion} target={target} />
        ) : (
          <SignInAgainStep deletion={deletion} />
        )}
      </div>
    </AdminOverlay>,
    document.body,
  );
}

function ExplainStep({ deletion, target }: StepProps) {
  const t = useTranslations("dangerZone");

  return (
    <>
      <p className="mt-2 text-[13.5px] leading-[1.5] text-[#676e78]">
        {t(`${target}.explain`, { name: deletion.startup?.name ?? "" })}
      </p>
      <p className="mt-4 text-[13px] font-medium text-[#22262b]">
        {t("erasedHeading")}
      </p>
      <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[13px] leading-[1.5] text-[#676e78]">
        {ERASED[target].map((key) => (
          <li key={key}>{t(key)}</li>
        ))}
      </ul>
      <p className="mt-4 text-[13px] font-medium text-[#22262b]">
        {t("keptHeading")}
      </p>
      <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[13px] leading-[1.5] text-[#676e78]">
        {KEPT[target].map((key) => (
          <li key={key}>{t(key)}</li>
        ))}
      </ul>
      <p className="mt-4 text-[13px] font-medium text-[#c2410c]">
        {t("irreversible")}
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={deletion.cancel}
          className={SECONDARY_BUTTON}
        >
          {t("cancel")}
        </button>
        <button
          type="button"
          autoFocus
          onClick={() => void deletion.proceed()}
          disabled={deletion.checkingSignIn}
          className={DESTRUCTIVE_BUTTON}
        >
          {t("continue")}
        </button>
      </div>
    </>
  );
}

function ConfirmStep({ deletion, target }: StepProps) {
  const t = useTranslations("dangerZone");
  const inputId = useId();
  const hintId = useId();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        deletion.confirm();
      }}
    >
      <label
        htmlFor={inputId}
        className="mt-4 block text-[13px] font-medium text-[#22262b]"
      >
        {t(`${target}.typeLabel`)}
      </label>
      <p id={hintId} className="mt-1 text-[13px] text-[#676e78]">
        {target === DeletionTarget.Account
          ? ACCOUNT_CONFIRMATION_WORD
          : (deletion.startup?.name ?? "")}
      </p>
      <input
        id={inputId}
        type="text"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        autoFocus
        value={deletion.typed}
        onChange={(event) => deletion.setTyped(event.target.value)}
        aria-describedby={hintId}
        className="mt-1.5 h-11 w-full rounded-2xl border border-[#e9ecef] px-4 text-[13.5px] text-[#22262b] outline-none focus:border-[#22262b]"
      />
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={deletion.cancel}
          disabled={deletion.pending}
          className={SECONDARY_BUTTON}
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          disabled={!deletion.canConfirm}
          className={DESTRUCTIVE_BUTTON}
        >
          {deletion.pending ? t("deleting") : t(`${target}.confirm`)}
        </button>
      </div>
    </form>
  );
}

function SignInAgainStep({ deletion }: { deletion: AccountDeletion }) {
  const t = useTranslations("dangerZone");

  return (
    <>
      <p className="mt-2 text-[13.5px] leading-[1.5] text-[#676e78]">
        {t("signInAgainBody")}
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={deletion.cancel}
          className={SECONDARY_BUTTON}
        >
          {t("cancel")}
        </button>
        <button
          type="button"
          autoFocus
          onClick={() => void deletion.signInAgain()}
          className={DESTRUCTIVE_BUTTON}
        >
          {t("signInAgain")}
        </button>
      </div>
    </>
  );
}
