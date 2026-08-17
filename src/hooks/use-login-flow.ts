"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { LOGIN_ROLE_GROUPS } from "@/lib/const";
import { LoginFlowStep, LoginRoleId } from "@/interfaces/login";

export function useLoginFlow() {
  const [step, setStep] = useState<LoginFlowStep>(LoginFlowStep.Roles);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<LoginRoleId>>(
    () => new Set(),
  );
  const [email, setEmail] = useState("");

  const selectedRoles = useMemo(
    () =>
      LOGIN_ROLE_GROUPS.flatMap((group) =>
        group.roles.filter((role) => selectedRoleIds.has(role.id)),
      ),
    [selectedRoleIds],
  );

  useEffect(() => {
    if (step !== LoginFlowStep.Verifying) {
      return;
    }

    const timeout = window.setTimeout(
      () => setStep(LoginFlowStep.Verified),
      900,
    );
    return () => window.clearTimeout(timeout);
  }, [step]);

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

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStep(LoginFlowStep.Verifying);
  }

  function resetFlow() {
    setStep(LoginFlowStep.Roles);
    setOpenGroup(null);
    setSelectedRoleIds(new Set());
    setEmail("");
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
    selectedRoles,
    toggleRole,
    submitLogin,
    resetFlow,
    unverifiedRoleId,
    verifiedRoles,
  };
}
