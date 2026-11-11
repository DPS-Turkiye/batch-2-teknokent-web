import { describe, expect, it } from "vitest";

import {
  OTG_FAILURE_PARAM,
  OtgLoginFailure,
  otgLoginFailure,
} from "@/lib/otg-login";

describe("otgLoginFailure", () => {
  // The start route writes it and the login pages and the proxy read it; a rename must not split them.
  it("is read from ?otg=", () => {
    expect(OTG_FAILURE_PARAM).toBe("otg");
  });

  it("names a known failure", () => {
    expect(otgLoginFailure("hata")).toBe(OtgLoginFailure.Failed);
  });

  it("refuses anything else", () => {
    for (const value of [null, "", "HATA", "iptal", "hata ", "<script>"]) {
      expect(otgLoginFailure(value)).toBeNull();
    }
  });
});
