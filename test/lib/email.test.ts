import { describe, expect, it } from "vitest";

import {
  EMAIL_TURKISH_CHAR_MESSAGE,
  emailCharacterError,
  formatEmailDomains,
  isAllowedEmailDomain,
  parseEmailDomains,
} from "@/lib/email";

describe("emailCharacterError", () => {
  it("accepts an ASCII address", () => {
    expect(emailCharacterError("gulse@dongu.co")).toBeNull();
  });

  it("rejects Turkish dotted and undotted letters in the address", () => {
    expect(emailCharacterError("süde@gmail.com")).toBe(
      EMAIL_TURKISH_CHAR_MESSAGE,
    );
    expect(emailCharacterError("sude@gmaıl.com")).toBe(
      EMAIL_TURKISH_CHAR_MESSAGE,
    );
  });
});

describe("parseEmailDomains", () => {
  it("reads a comma list into bare lowercase domains", () => {
    expect(
      parseEmailDomains(" metu.edu.tr, @ODTU.edu.tr,,metu.edu.tr "),
    ).toEqual(["metu.edu.tr", "odtu.edu.tr"]);
  });

  it("is empty when the setting is missing or blank", () => {
    expect(parseEmailDomains(undefined)).toEqual([]);
    expect(parseEmailDomains("  ")).toEqual([]);
  });
});

describe("isAllowedEmailDomain", () => {
  const metu = ["metu.edu.tr"];

  it("lets any address through when no domain is set", () => {
    expect(isAllowedEmailDomain("ayse@gmail.com", [])).toBe(true);
  });

  it("accepts the domain and its subdomains, ignoring case", () => {
    expect(isAllowedEmailDomain("e123456@metu.edu.tr", metu)).toBe(true);
    expect(isAllowedEmailDomain("Ali@METU.edu.tr ", metu)).toBe(true);
    expect(isAllowedEmailDomain("ali@ceng.metu.edu.tr", metu)).toBe(true);
  });

  it("rejects other and lookalike domains", () => {
    expect(isAllowedEmailDomain("ali@gmail.com", metu)).toBe(false);
    expect(isAllowedEmailDomain("ali@fakemetu.edu.tr", metu)).toBe(false);
    expect(isAllowedEmailDomain("ali@metu.edu.tr.evil.com", metu)).toBe(false);
    expect(isAllowedEmailDomain("ali.metu.edu.tr", metu)).toBe(false);
  });
});

describe("formatEmailDomains", () => {
  it("shows each domain with its @", () => {
    expect(formatEmailDomains(["metu.edu.tr", "odtu.edu.tr"])).toBe(
      "@metu.edu.tr, @odtu.edu.tr",
    );
  });
});
