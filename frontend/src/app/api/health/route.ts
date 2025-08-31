import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "ui-api",
    time: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
}

