import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

window.scrollTo = () => {};

const originalGetComputedStyle = window.getComputedStyle.bind(window);

function fallbackComputedStyle(): CSSStyleDeclaration {
  return {
    getPropertyValue(property: string) {
      switch (property) {
        case "font":
          return "16px sans-serif";
        case "font-size":
          return "16px";
        case "display":
          return "block";
        case "visibility":
          return "visible";
        case "content":
          return "none";
        default:
          return "";
      }
    },
  } as CSSStyleDeclaration;
}

window.getComputedStyle = ((element: Element, pseudoElt?: string | null) => {
  try {
    return originalGetComputedStyle(element, pseudoElt);
  } catch {
    return fallbackComputedStyle();
  }
}) as typeof window.getComputedStyle;

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  try {
    sessionStorage.clear();
  } catch {}
});

// A component rendered without NextIntlClientProvider reads Turkish, as production does with no
// locale cookie; tests that need English wrap their render in <InLocale locale="en">.
vi.mock("next-intl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-intl")>();
  const { default: tr } = await import("@/messages/tr.json");
  return {
    ...actual,
    useTranslations: (namespace?: string) => {
      try {
        return actual.useTranslations(namespace as never);
      } catch {
        return actual.createTranslator({
          locale: "tr",
          messages: tr,
          namespace: namespace as never,
        });
      }
    },
    useLocale: () => {
      try {
        return actual.useLocale();
      } catch {
        return "tr";
      }
    },
  };
});
