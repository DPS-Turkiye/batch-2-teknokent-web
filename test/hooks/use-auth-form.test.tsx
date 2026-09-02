import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useRegisterForm } from "@/hooks/use-auth-form";

const STRONG_PASSWORD = "Sifre1234!";

describe("useRegisterForm", () => {
  function fillValid(result: { current: ReturnType<typeof useRegisterForm> }) {
    act(() => {
      result.current.update("firstName", "Gülse");
      result.current.update("lastName", "Buran");
      result.current.update("email", "gulse@dongu.co");
      result.current.update("phone", "+905551112233");
      result.current.update("password", STRONG_PASSWORD);
      result.current.update("passwordConfirm", STRONG_PASSWORD);
    });
  }

  it("enables submission only when every field is valid", () => {
    const { result } = renderHook(() => useRegisterForm());

    expect(result.current.canSubmit).toBe(false);
    fillValid(result);
    expect(result.current.canSubmit).toBe(true);
  });

  it("flags a weak password, but not while empty", () => {
    const { result } = renderHook(() => useRegisterForm());

    expect(result.current.passwordStrengthErrorMessage).toBeNull();

    act(() => result.current.update("password", "kisa"));
    expect(result.current.passwordStrengthErrorMessage).toMatch(/en az 8/);
    expect(result.current.canSubmit).toBe(false);

    act(() => result.current.update("password", STRONG_PASSWORD));
    expect(result.current.passwordStrengthErrorMessage).toBeNull();
  });

  it("refuses a long password that is still missing a symbol", () => {
    const { result } = renderHook(() => useRegisterForm());
    fillValid(result);

    act(() => {
      result.current.update("password", "sifre1234");
      result.current.update("passwordConfirm", "sifre1234");
    });
    expect(result.current.canSubmit).toBe(false);
    expect(result.current.passwordStrengthErrorMessage).toMatch(
      /büyük harf|özel karakter/,
    );
  });

  it("flags mismatched passwords only once the confirmation is typed", () => {
    const { result } = renderHook(() => useRegisterForm());

    act(() => result.current.update("password", STRONG_PASSWORD));
    expect(result.current.passwordsMismatch).toBe(false);

    act(() => result.current.update("passwordConfirm", "Sifre12"));
    expect(result.current.passwordsMismatch).toBe(true);

    act(() => result.current.update("passwordConfirm", STRONG_PASSWORD));
    expect(result.current.passwordsMismatch).toBe(false);
  });

  it("refuses submission when the passwords do not match", () => {
    const { result } = renderHook(() => useRegisterForm());
    fillValid(result);

    act(() => result.current.update("passwordConfirm", "BaskaSifre1!"));
    expect(result.current.canSubmit).toBe(false);
  });

  it("refuses an email that contains ı or other Turkish letters", () => {
    const { result } = renderHook(() => useRegisterForm());
    fillValid(result);

    act(() => result.current.update("email", "süde@gmail.com"));
    expect(result.current.canSubmit).toBe(false);
    expect(result.current.emailCharacterErrorMessage).toMatch(/ı yerine i/);
  });
});
