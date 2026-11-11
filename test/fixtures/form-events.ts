import type { SubmitEvent } from "react";
import { vi } from "vitest";

/**
 * A submit of a real <form>, as React hands it to an onSubmit handler, so a hook's submit can be
 * called directly. `preventDefault` is a spy and also sets `defaultPrevented`.
 */
export function formSubmitEvent(
  form: HTMLFormElement = document.createElement("form"),
): SubmitEvent<HTMLFormElement> {
  let prevented = false;
  return {
    nativeEvent: new window.SubmitEvent("submit", { cancelable: true }),
    submitter: null,
    currentTarget: form,
    target: form,
    bubbles: true,
    cancelable: true,
    get defaultPrevented() {
      return prevented;
    },
    eventPhase: Event.AT_TARGET,
    isTrusted: false,
    preventDefault: vi.fn(() => {
      prevented = true;
    }),
    isDefaultPrevented: () => prevented,
    stopPropagation: vi.fn(),
    isPropagationStopped: () => false,
    persist: vi.fn(),
    timeStamp: 0,
    type: "submit",
  };
}
