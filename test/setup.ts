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
