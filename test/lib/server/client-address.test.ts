import { describe, expect, it } from "vitest";

import {
  clientAddress,
  clientAddressHeaders,
} from "@/lib/server/client-address";

describe("clientAddress", () => {
  it("prefers the address CloudFront wrote, without its port", () => {
    expect(
      clientAddress(
        new Headers({
          "cloudfront-viewer-address": "203.0.113.7:46532",
          "x-forwarded-for": "198.51.100.1",
        }),
      ),
    ).toBe("203.0.113.7");
    expect(
      clientAddress(
        new Headers({ "cloudfront-viewer-address": "2001:db8::1:46532" }),
      ),
    ).toBe("2001:db8::1");
    expect(
      clientAddress(
        new Headers({ "cloudfront-viewer-address": "[2001:db8::1]:443" }),
      ),
    ).toBe("2001:db8::1");
  });

  it("falls back to the first forwarded address, then X-Real-IP", () => {
    expect(
      clientAddress(
        new Headers({ "x-forwarded-for": " 198.51.100.1 , 10.0.0.1" }),
      ),
    ).toBe("198.51.100.1");
    expect(clientAddress(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe(
      "198.51.100.2",
    );
    expect(clientAddress(new Headers())).toBeNull();
  });

  it("passes on only an IP literal, and never the browser's own address header", () => {
    expect(
      clientAddress(new Headers({ "x-forwarded-for": "evil.example.com" })),
    ).toBeNull();
    expect(
      clientAddress(
        new Headers({ "cloudfront-viewer-address": "not-an-ip:443" }),
      ),
    ).toBeNull();
    expect(
      clientAddress(
        new Headers({
          "x-forwarded-for": "bogus",
          "x-real-ip": "198.51.100.2",
        }),
      ),
    ).toBe("198.51.100.2");
    expect(
      clientAddress(new Headers({ "x-menton-client-address": "1.2.3.4" })),
    ).toBeNull();
  });

  it("builds the backend header only when there is an address", () => {
    expect(clientAddressHeaders("203.0.113.7")).toEqual({
      "X-Menton-Client-Address": "203.0.113.7",
    });
    expect(clientAddressHeaders(null)).toEqual({});
  });
});
