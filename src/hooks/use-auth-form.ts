"use client";

import { useCallback, useMemo, useState } from "react";

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirm: string;
}

export const PASSWORD_MIN_LENGTH = 8;

/**
 * Form state for the login screen. UI-only: the auth backend is another
 * developer's work, so nothing is submitted anywhere yet.
 */
export function useLoginForm() {
  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });

  const update = useCallback(
    <K extends keyof LoginForm>(key: K, value: LoginForm[K]) =>
      setForm((current) => ({ ...current, [key]: value })),
    [],
  );

  const canSubmit = Boolean(form.email.trim() && form.password.trim());

  return { form, update, canSubmit };
}

/** Form state for mentee account creation. UI-only, as above. */
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

  const passwordTooShort =
    form.password.length > 0 && form.password.length < PASSWORD_MIN_LENGTH;

  const passwordsMismatch =
    form.passwordConfirm.length > 0 && form.password !== form.passwordConfirm;

  const canSubmit = useMemo(
    () =>
      Boolean(
        form.firstName.trim() &&
        form.lastName.trim() &&
        form.email.trim() &&
        form.phone.trim() &&
        form.password.length >= PASSWORD_MIN_LENGTH &&
        form.password === form.passwordConfirm,
      ),
    [form],
  );

  return { form, update, canSubmit, passwordTooShort, passwordsMismatch };
}
