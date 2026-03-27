import { NextResponse } from "next/server";

export async function GET() {
  const pin = process.env.PREVIEW_PIN;
  return NextResponse.json({
    pinSet: !!pin,
    pinLength: pin?.length ?? 0,
    vercelEnv: process.env.VERCEL_ENV ?? "not set",
  });
}
