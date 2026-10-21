import { NextResponse } from "next/server";

import { fetchBackendHealth, HealthFetchError } from "@/lib/health";
import { apiText } from "@/lib/server/api-response";

export async function GET() {
  try {
    const { data, httpStatus } = await fetchBackendHealth();

    return NextResponse.json(data, { status: httpStatus });
  } catch (error) {
    if (error instanceof HealthFetchError) {
      return NextResponse.json({ message: error.message }, { status: 502 });
    }

    return NextResponse.json(
      { message: await apiText("healthCheckFailed") },
      { status: 500 },
    );
  }
}
