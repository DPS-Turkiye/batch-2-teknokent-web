import { NextResponse } from "next/server";

import { getBackendUrl } from "@/lib/const";

export async function POST(request: Request) {
  const username = process.env.BACKEND_USERNAME ?? "teknokent";
  const password = process.env.BACKEND_PASSWORD ?? "change-me";
  try {
    const response = await fetch(
      `${getBackendUrl()}/api/mentor-recommendations`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: await request.text(),
        cache: "no-store",
      },
    );
    const responseText = await response.text();
    const matchingMethod = response.headers.get("x-matching-method");
    const matchingModel = response.headers.get("x-matching-model");
    const generatedAt = response.headers.get("x-recommendation-generated-at");
    const responseHeaders = new Headers({ "Content-Type": "application/json" });
    if (matchingMethod)
      responseHeaders.set("X-Matching-Method", matchingMethod);
    if (matchingModel) responseHeaders.set("X-Matching-Model", matchingModel);
    if (generatedAt)
      responseHeaders.set("X-Recommendation-Generated-At", generatedAt);
    return new NextResponse(
      responseText ||
        JSON.stringify({ message: "Backend boş yanıt döndürdü." }),
      {
        status: response.status,
        headers: responseHeaders,
      },
    );
  } catch {
    return NextResponse.json(
      { message: "Mentor eşleştirme servisine ulaşılamadı." },
      { status: 502 },
    );
  }
}
