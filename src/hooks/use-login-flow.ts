"use client";

import { FormEvent, useMemo, useState } from "react";

import { useSession } from "@/components/providers/session-provider";
import { LOGIN_ROLE_GROUPS } from "@/lib/const";
import { LoginFlowStep, LoginRoleId } from "@/interfaces/login";

export function useLoginFlow() {
  const { login } = useSession();
  const [step, setStep] = useState<LoginFlowStep>(LoginFlowStep.Roles);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<LoginRoleId>>(
    () => new Set(),
  );
  const [email, setEmail] = useState("");
  const [loginError, setLoginError] = useState("");

  const selectedRoles = useMemo(
    () =>
      LOGIN_ROLE_GROUPS.flatMap((group) =>
        group.roles.filter((role) => selectedRoleIds.has(role.id)),
      ),
    [selectedRoleIds],
  );

  function toggleRole(roleId: LoginRoleId) {
    setSelectedRoleIds((current) => {
      const next = new Set(current);
      if (next.has(roleId)) {
        next.delete(roleId);
      } else {
        next.add(roleId);
      }
      return next;
    });
  }

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    setStep(LoginFlowStep.Verifying);
    try {
      await login(email);
      setStep(LoginFlowStep.Verified);
    } catch (error) {
      setLoginError(
        error instanceof Error
          ? error.message
          : "Giriş tamamlanamadı. Lütfen tekrar deneyin.",
      );
      setStep(LoginFlowStep.Login);
    }
  }

  function resetFlow() {
    setStep(LoginFlowStep.Roles);
    setOpenGroup(null);
    setSelectedRoleIds(new Set());
    setEmail("");
    setLoginError("");
  }

  const unverifiedRoleId =
    selectedRoleIds.has(LoginRoleId.Mentor) &&
    selectedRoleIds.has(LoginRoleId.Trainer)
      ? LoginRoleId.Trainer
      : null;
  const verifiedRoles = selectedRoles.filter(
    (role) => role.id !== unverifiedRoleId,
  );

  return {
    roleGroups: LOGIN_ROLE_GROUPS,
    step,
    setStep,
    openGroup,
    setOpenGroup,
    selectedRoleIds,
    email,
    setEmail,
    loginError,
    selectedRoles,
    toggleRole,
    submitLogin,
    resetFlow,
    unverifiedRoleId,
    verifiedRoles,
  };
}
