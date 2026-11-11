import { webcrypto } from "node:crypto";
import {
  ReadableStream,
  TransformStream,
  WritableStream,
} from "node:stream/web";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

import { useDocumentPreviewStore } from "@/stores/document-preview-store";
import { useToastStore } from "@/stores/toast-store";
import type { MessageNamespace } from "@test/i18n";

// The vm window is jsdom's own. It has neither Web Crypto nor web streams, whatever lib.dom says.
const vmWindow: { crypto?: Partial<Crypto>; ReadableStream?: unknown } =
  globalThis;
if (!vmWindow.crypto?.subtle) {
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: webcrypto,
  });
}
if (vmWindow.ReadableStream === undefined) {
  Object.assign(globalThis, {
    ReadableStream,
    WritableStream,
    TransformStream,
  });
}

// Request.json on an externalized NextRequest parses in Node's realm, so a
// bad body throws a SyntaxError this realm's `instanceof` does not see.
// Parsing the text here keeps every other part of json() (UTF-8 decoding, a
// used body rejecting with TypeError, an empty body failing to parse).
// https://vitest.dev/config/pool#vmthreads
async function parseJsonInThisRealm(this: Body): Promise<unknown> {
  return JSON.parse(await this.text());
}

/** The prototype that declares json(), and its parent when the class extends another one. */
function bodyPrototypes(ctor: typeof Request | typeof Response): object[] {
  const own: object = ctor.prototype;
  const parent: unknown = Object.getPrototypeOf(own);
  return typeof parent === "object" && parent !== null ? [own, parent] : [own];
}

for (const prototype of [Request, Response].flatMap(bodyPrototypes)) {
  if ("json" in prototype) prototype.json = parseJsonInThisRealm;
}

window.scrollTo = () => {};
// jsdom does not implement scrolling an element into view.
Element.prototype.scrollIntoView = () => {};

// jsdom has no matchMedia. Answer like a browser that matches no media query
// (no reduced motion, coarse pointer); a test that needs a preference stubs it.
if (typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string): MediaQueryList => {
    const list = new EventTarget();
    return Object.assign(list, {
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
    });
  };
}

// jsdom has no layout, so nothing ever resizes; observers only need to exist.
if (typeof globalThis.ResizeObserver !== "function") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

const originalGetComputedStyle = window.getComputedStyle.bind(window);

const FALLBACK_STYLE = new Map([
  ["font", "16px sans-serif"],
  ["font-size", "16px"],
  ["display", "block"],
  ["visibility", "visible"],
  ["content", "none"],
]);

/** A style jsdom could not compute (an element from another realm): a plain block in 16px text. */
function fallbackComputedStyle(): CSSStyleDeclaration {
  const style = document.createElement("div").style;
  style.getPropertyValue = (property) => FALLBACK_STYLE.get(property) ?? "";
  return style;
}

window.getComputedStyle = (element: Element, pseudoElt?: string | null) => {
  try {
    return originalGetComputedStyle(element, pseudoElt);
  } catch {
    return fallbackComputedStyle();
  }
};

afterEach(() => {
  cleanup();
  // The stores outlive a test's render, so one test's toast or open preview must not leak into the next.
  useToastStore.setState({ toasts: [] });
  useDocumentPreviewStore.setState({ file: null });
  vi.restoreAllMocks();
  try {
    sessionStorage.clear();
  } catch {}
});

// A component rendered without NextIntlClientProvider reads Turkish, as production does with no
// locale cookie; tests that need English wrap their render in <InLocale locale="en">.
vi.mock("next-intl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-intl")>();
  const { Locale } = await import("@/lib/i18n");
  const { turkishTranslator } = await import("@test/i18n");
  const useTranslations: typeof actual.useTranslations = (namespace) => {
    try {
      return actual.useTranslations(namespace);
    } catch {
      return turkishTranslator(actual.createTranslator, namespace);
    }
  };
  return {
    ...actual,
    useTranslations,
    useLocale: () => {
      try {
        return actual.useLocale();
      } catch {
        return Locale.Tr;
      }
    },
  };
});

// Server components and loading screens read Turkish too; there is no request config in tests.
vi.mock("next-intl/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-intl/server")>();
  const { createTranslator } = await import("next-intl");
  const { Locale } = await import("@/lib/i18n");
  const { turkishTranslator } = await import("@test/i18n");
  return {
    ...actual,
    getLocale: async () => Locale.Tr,
    getTranslations: async <Name extends MessageNamespace = never>(
      namespace?: Name,
    ) => turkishTranslator(createTranslator, namespace),
  };
});

// Plain modules (lib/client, lib/firebase) read error texts through clientText(); the app's root
// layout hands them the translator, so each test starts with the Turkish one.
const { clientTextsIn } = await import("@test/client-texts");
clientTextsIn("tr");
afterEach(() => clientTextsIn("tr"));
