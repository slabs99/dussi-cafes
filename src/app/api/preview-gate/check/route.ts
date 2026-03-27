import { NextResponse } from "next/server";

export async function GET() {
  const pin = process.env.PREVIEW_PIN ?? "";
  // Show char codes so we can spot hidden/invisible characters
  const codes = Array.from(pin).map((c) => c.charCodeAt(0));
  return NextResponse.json({
    pinSet: !!pin,
    pinLength: pin.length,
    charCodes: codes,
    vercelEnv: process.env.VERCEL_ENV ?? "not set",
  });
}
