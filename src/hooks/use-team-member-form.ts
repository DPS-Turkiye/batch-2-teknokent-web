"use client";

import { useCallback, useState } from "react";

import type { TeamMemberDraft } from "@/interfaces/signup";
import { ALLOWED_EMAIL_DOMAINS } from "@/lib/const";
import {
  EMAIL_PATTERN,
  formatEmailDomains,
  isAllowedEmailDomain,
} from "@/lib/email";

const EMPTY: TeamMemberDraft = { fullName: "", jobTitle: "", email: "" };

/** The inline "+ Üye ekle" form on the startup step. */
export function useTeamMemberForm(
  onAdd: (member: TeamMemberDraft) => void,
  allowedEmailDomains: readonly string[] = ALLOWED_EMAIL_DOMAINS,
) {
  const [open, setOpen] = useState(false);
  const [member, setMember] = useState<TeamMemberDraft>(EMPTY);
  const [error, setError] = useState("");

  const update = useCallback(
    (key: keyof TeamMemberDraft, value: string) =>
      setMember((current) => ({ ...current, [key]: value })),
    [],
  );

  const cancel = useCallback(() => {
    setMember(EMPTY);
    setError("");
    setOpen(false);
  }, []);

  const openForm = useCallback(() => setOpen(true), []);

  const submit = useCallback(() => {
    const fullName = member.fullName.trim();
    const email = member.email.trim();
    if (!fullName) {
      setError("Üyenin adını yaz.");
      return;
    }
    if (email && !EMAIL_PATTERN.test(email)) {
      setError("Geçerli bir e-posta adresi yaz.");
      return;
    }
    if (email && !isAllowedEmailDomain(email, allowedEmailDomains)) {
      setError(
        `Üyenin ${formatEmailDomains(allowedEmailDomains)} uzantılı e-posta adresini yaz.`,
      );
      return;
    }
    onAdd({ fullName, jobTitle: member.jobTitle.trim(), email });
    cancel();
  }, [allowedEmailDomains, cancel, member, onAdd]);

  return { open, openForm, member, error, update, submit, cancel };
}
