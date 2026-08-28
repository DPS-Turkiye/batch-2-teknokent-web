import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  PASSWORD_MIN_LENGTH,
  useLoginForm,
  useRegisterForm,
} from "@/hooks/use-auth-form";

describe("useLoginForm", () => {
  it("blocks submission until both fields are filled", () => {
    const { result } = renderHook(() => useLoginForm());

    expect(result.current.canSubmit).toBe(false);

    act(() => result.current.update("email", "gulse@dongu.co"));
    expect(result.current.canSubmit).toBe(false);

    act(() => result.current.update("password", "sifre1234"));
    expect(result.current.canSubmit).toBe(true);
  });

  it("does not accept whitespace as a filled field", () => {
    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.update("email", "   ");
      result.current.update("password", "   ");
    });

    expect(result.current.canSubmit).toBe(false);
  });
});

describe("useRegisterForm", () => {
  function fillValid(result: { current: ReturnType<typeof useRegisterForm> }) {
    act(() => {
      result.current.update("firstName", "Gülse");
      result.current.update("lastName", "Buran");
      result.current.update("email", "gulse@dongu.co");
      result.current.update("phone", "+905551112233");
      result.current.update("password", "sifre1234");
      result.current.update("passwordConfirm", "sifre1234");
    });
  }

  it("enables submission only when every field is valid", () => {
    const { result } = renderHook(() => useRegisterForm());

    expect(result.current.canSubmit).toBe(false);
    fillValid(result);
    expect(result.current.canSubmit).toBe(true);
  });

  it("flags a password below the minimum length, but not while empty", () => {
    const { result } = renderHook(() => useRegisterForm());

    expect(result.current.passwordTooShort).toBe(false);

    act(() => result.current.update("password", "kisa"));
    expect(result.current.passwordTooShort).toBe(true);
    expect(result.current.canSubmit).toBe(false);

    act(() =>
      result.current.update("password", "a".repeat(PASSWORD_MIN_LENGTH)),
    );
    expect(result.current.passwordTooShort).toBe(false);
  });

  it("flags mismatched passwords only once the confirmation is typed", () => {
    const { result } = renderHook(() => useRegisterForm());

    act(() => result.current.update("password", "sifre1234"));
    expect(result.current.passwordsMismatch).toBe(false);

    act(() => result.current.update("passwordConfirm", "sifre12"));
    expect(result.current.passwordsMismatch).toBe(true);

    act(() => result.current.update("passwordConfirm", "sifre1234"));
    expect(result.current.passwordsMismatch).toBe(false);
  });

  it("refuses submission when the passwords do not match", () => {
    const { result } = renderHook(() => useRegisterForm());
    fillValid(result);

    act(() => result.current.update("passwordConfirm", "baskasifre"));
    expect(result.current.canSubmit).toBe(false);
  });
});
