import { NextResponse } from "next/server";

import { fetchBackendHealth, HealthFetchError } from "@/lib/health";

export async function GET() {
  try {
    const { data, httpStatus } = await fetchBackendHealth();

    return NextResponse.json(data, { status: httpStatus });
  } catch (error) {
    if (error instanceof HealthFetchError) {
      return NextResponse.json({ message: error.message }, { status: 502 });
    }

    return NextResponse.json(
      { message: "Unexpected health check failure" },
      { status: 500 },
    );
  }
}
