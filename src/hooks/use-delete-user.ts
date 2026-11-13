"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAppSession } from "@/components/providers/session-provider";
import { ADMIN_OVERVIEW_QUERY_KEY } from "@/hooks/use-admin-overview";
import { personSummaryQueryKey } from "@/hooks/use-person-summary";
import { ToastTone } from "@/interfaces/toast";
import { deleteUserAccount } from "@/lib/client/admin-users";
import { getPersonSummary } from "@/lib/client/person-summary";
import { currentIdToken } from "@/lib/firebase/auth";
import { canOfferDeletion, confirmsDeletion } from "@/lib/user-deletion";
import { errorMessage } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";

const USERS_LIST_HREF = "/admin/users";
/** Prefix of the admin people lists (students and the like) a deleted person must drop out of. */
const ADMIN_LISTS_KEY = ["admin"] as const;

/** Deleting one account for good, after the admin typed its address. */
export function useDeleteUser(userId: string) {
  const t = useTranslations("adminUsers.deleteUser");
  const session = useAppSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [typedEmail, setTypedEmail] = useState("");
  // Shares the profile page's query, so the account is read once.
  const { data: person } = useQuery({
    queryKey: personSummaryQueryKey(userId),
    queryFn: () => getPersonSummary(userId),
  });

  const remove = useMutation({
    mutationFn: async (confirmEmail: string) => {
      const idToken = await currentIdToken();
      if (!idToken) throw new Error(t("signInAgain"));
      return deleteUserAccount(userId, confirmEmail, idToken);
    },
  });

  function close() {
    setConfirming(false);
    setTypedEmail("");
  }

  function cancel() {
    // Escape or a backdrop click must not hide a deletion that is already on its way.
    if (!remove.isPending) close();
  }

  function confirm() {
    if (remove.isPending) return;
    // Per-call callbacks, unlike a promise, do not fire once the admin has left this page.
    remove.mutate(typedEmail, {
      onSuccess: (result) => {
        close();
        showToast({
          message: t(result.cleanupPending ? "donePending" : "done"),
          tone: ToastTone.Success,
        });
        // Leave first: refetching the open profile would flash the deleted person as "not found".
        router.replace(USERS_LIST_HREF);
        void queryClient.invalidateQueries({
          queryKey: personSummaryQueryKey(userId),
          refetchType: "none",
        });
        void queryClient.invalidateQueries({
          queryKey: ADMIN_OVERVIEW_QUERY_KEY,
        });
        void queryClient.invalidateQueries({ queryKey: ADMIN_LISTS_KEY });
      },
      onError: (error) =>
        showToast({
          message: errorMessage(error, t("failed")),
          tone: ToastTone.Error,
        }),
    });
  }

  return {
    person:
      person && canOfferDeletion(person, session?.userId ?? null)
        ? { fullName: person.fullName, email: person.email }
        : null,
    confirming,
    typedEmail,
    canConfirm:
      person !== undefined &&
      confirmsDeletion(typedEmail, person.email) &&
      !remove.isPending,
    pending: remove.isPending,
    ask: () => setConfirming(true),
    cancel,
    setTypedEmail,
    confirm,
  };
}
