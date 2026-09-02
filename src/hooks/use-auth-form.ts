"use client";

import { useCallback, useMemo, useState } from "react";

import { type RegisterForm } from "@/interfaces/auth";
import { emailCharacterError } from "@/lib/email";
import { passwordStrengthError } from "@/lib/password";

export function useRegisterForm() {
  const [form, setForm] = useState<RegisterForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    passwordConfirm: "",
  });

  const update = useCallback(
    <K extends keyof RegisterForm>(key: K, value: RegisterForm[K]) =>
      setForm((current) => ({ ...current, [key]: value })),
    [],
  );

  const passwordStrengthErrorMessage = passwordStrengthError(form.password);

  const passwordsMismatch =
    form.passwordConfirm.length > 0 && form.password !== form.passwordConfirm;

  const emailCharacterErrorMessage = emailCharacterError(form.email);

  const canSubmit = useMemo(
    () =>
      Boolean(
        form.firstName.trim() &&
        form.lastName.trim() &&
        form.email.trim() &&
        !emailCharacterErrorMessage &&
        form.phone.trim() &&
        form.password.trim() &&
        !passwordStrengthErrorMessage &&
        form.password === form.passwordConfirm,
      ),
    [form, emailCharacterErrorMessage, passwordStrengthErrorMessage],
  );

  return {
    form,
    update,
    canSubmit,
    passwordStrengthErrorMessage,
    passwordsMismatch,
    emailCharacterErrorMessage,
  };
}
