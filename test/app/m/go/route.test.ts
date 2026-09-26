import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { GET } from "@/app/m/go/route";

describe("GET /m/go", () => {
  it("sends a tapped message notification to the phone's Mesajlar tab", () => {
    const response = GET(
      new NextRequest("http://localhost/m/go?category=MESSAGE"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/m/messages",
    );
  });

  it("opens the notification list for anything it does not recognise", () => {
    const response = GET(new NextRequest("http://localhost/m/go"));

    expect(response.headers.get("location")).toBe(
      "http://localhost/m/notifications",
    );
  });
});
