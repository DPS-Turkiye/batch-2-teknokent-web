import { NextResponse } from "next/server";

import { getBackendUrl } from "@/lib/const";
import { getSessionIds } from "@/lib/server-session";

function headers() {
  const username = process.env.BACKEND_USERNAME ?? "teknokent";
  const password = process.env.BACKEND_PASSWORD ?? "change-me";
  return {
    Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
    Accept: "application/json",
  };
}

export async function GET() {
  try {
    const { organizationId } = await getSessionIds();
    const response = await fetch(
      `${getBackendUrl()}/api/profile-analyses/latest?organizationId=${organizationId}`,
      { headers: headers(), cache: "no-store" },
    );
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json(
      { message: "Profil servisine ulaşılamadı." },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId } = await getSessionIds();
    const form = await request.formData();
    const file = form.get("file");
    const profileType = form.get("profileType");
    const consentAccepted = form.get("consentAccepted") === "true";
    const requestedOcrMode = form.get("ocrMode");
    const ocrMode = ["off", "auto", "force"].includes(String(requestedOcrMode))
      ? String(requestedOcrMode)
      : "auto";
    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "PDF dosyası seçin." },
        { status: 400 },
      );
    }
    if (!consentAccepted) {
      return NextResponse.json(
        { message: "Belge işleme onayı gereklidir." },
        { status: 400 },
      );
    }
    const backendForm = new FormData();
    backendForm.set("file", file);
    const response = await fetch(
      `${getBackendUrl()}/api/profile-analyses?organizationId=${organizationId}&profileType=${profileType === "individual_mentee" ? "individual_mentee" : "mentee"}&consentAccepted=true&ocrMode=${ocrMode}`,
      {
        method: "POST",
        headers: headers(),
        body: backendForm,
        cache: "no-store",
      },
    );
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json(
      { message: "Profil servisine ulaşılamadı." },
      { status: 502 },
    );
  }
}
