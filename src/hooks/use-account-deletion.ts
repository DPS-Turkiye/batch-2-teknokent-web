"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useSession } from "@/components/providers/session-provider";
import {
  AccountDeletionBlock,
  SelfDeletionErrorCode,
} from "@/interfaces/self-deletion";
import { ToastTone } from "@/interfaces/toast";
import { replaceLocation } from "@/lib/assign-location";
import { ClientApiError } from "@/lib/client/api";
import {
  deleteOwnAccount,
  deleteOwnStartup,
  getSelfDeletionOptions,
} from "@/lib/client/self-deletion";
import { currentIdToken, currentSignInTime } from "@/lib/firebase/auth";
import { loginPathFor } from "@/lib/public-paths";
import {
  accountDeletedHref,
  asksForSelfDeletion,
  confirmsAccountDeletion,
  confirmsStartupDeletion,
  signedInRecently,
} from "@/lib/self-deletion";
import { errorMessage } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";
import { DeletionStep, DeletionTarget } from "@/types/self-deletion";

export const SELF_DELETION_QUERY_KEY = ["self-deletion"] as const;

/** Where a founder lands once their startup is gone, and where a fresh sign-in returns to: needs no team. */
const PROFILE_HREF = "/profile/personal";

type OpenDialog = { target: DeletionTarget; step: DeletionStep };

export type AccountDeletion = ReturnType<typeof useAccountDeletion>;

/**
 * The profile's "Tehlikeli bölge": what the person may delete (the backend decides), the two confirmations, the
 * fresh sign-in a deletion needs, and where the person lands afterwards.
 */
export function useAccountDeletion() {
  const t = useTranslations("dangerZone");
  const { session, logout, refresh } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showToast } = useToast();
  const [dialog, setDialog] = useState<OpenDialog | null>(null);
  const [typed, setTyped] = useState("");
  const [checkingSignIn, setCheckingSignIn] = useState(false);

  async function idToken() {
    const token = await currentIdToken();
    if (!token) throw new Error(t("signInAgainBody"));
    return token;
  }

  const options = useQuery({
    queryKey: [...SELF_DELETION_QUERY_KEY, session?.userId],
    queryFn: async () => getSelfDeletionOptions(await idToken()),
    enabled: asksForSelfDeletion(session),
  });

  const remove = useMutation({
    mutationFn: async ({
      target,
      confirmation,
    }: {
      target: DeletionTarget;
      confirmation: string;
    }) => {
      const token = await idToken();
      return target === DeletionTarget.Account
        ? deleteOwnAccount(confirmation, token)
        : deleteOwnStartup(confirmation, token);
    },
  });

  const account = options.data?.account ?? null;
  const startup = options.data?.startup ?? null;
  const accountOffered =
    account !== null && account.blockedReason !== AccountDeletionBlock.Staff;
  const matches =
    dialog?.target === DeletionTarget.Startup
      ? startup !== null && confirmsStartupDeletion(typed, startup.name)
      : confirmsAccountDeletion(typed);
  const canConfirm =
    dialog?.step === DeletionStep.Confirm && matches && !remove.isPending;

  function close() {
    setDialog(null);
    setTyped("");
  }

  function cancel() {
    // Escape or a backdrop click must not hide a deletion that is already on its way.
    if (!remove.isPending) close();
  }

  function open(target: DeletionTarget) {
    setTyped("");
    setDialog({ target, step: DeletionStep.Explain });
  }

  /** From the explanation to the typed confirmation, unless the sign-in is too old to delete with. */
  async function proceed() {
    if (!dialog) return;
    setCheckingSignIn(true);
    try {
      const signedInAt = await currentSignInTime().catch(() => null);
      setDialog({
        target: dialog.target,
        step: signedInRecently(signedInAt, new Date())
          ? DeletionStep.Confirm
          : DeletionStep.SignInAgain,
      });
    } finally {
      setCheckingSignIn(false);
    }
  }

  async function signInAgain() {
    await logout().catch(() => undefined);
    replaceLocation(loginPathFor(PROFILE_HREF));
  }

  async function afterAccountDeleted() {
    // The backend has already removed the login and the cookie; this clears what the browser still holds.
    await logout().catch(() => undefined);
    replaceLocation(accountDeletedHref());
  }

  async function afterStartupDeleted() {
    close();
    showToast({ message: t("startup.done"), tone: ToastTone.Success });
    await refresh();
    await queryClient.invalidateQueries();
    router.replace(PROFILE_HREF);
  }

  function confirm() {
    if (!dialog || !canConfirm) return;
    const { target } = dialog;
    remove.mutate(
      { target, confirmation: typed },
      {
        onSuccess: () =>
          void (target === DeletionTarget.Account
            ? afterAccountDeleted()
            : afterStartupDeleted()),
        onError: (error) => {
          if (
            error instanceof ClientApiError &&
            error.code === SelfDeletionErrorCode.ReauthRequired
          ) {
            setDialog({ target, step: DeletionStep.SignInAgain });
            return;
          }
          showToast({
            message: errorMessage(error, t("failed")),
            tone: ToastTone.Error,
          });
        },
      },
    );
  }

  return {
    /** Nothing to show: a coordinator or admin, another edition, or no answer yet. */
    hidden: !accountOffered && startup === null,
    /** Whether "Hesabımı sil" is shown; it may still be blocked, with the reason below. */
    accountOffered,
    accountBlockedReason: account?.blockedReason ?? null,
    startup,
    dialog,
    typed,
    setTyped,
    canConfirm,
    pending: remove.isPending,
    checkingSignIn,
    open,
    proceed,
    cancel,
    confirm,
    signInAgain,
  };
}
