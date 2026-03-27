import { NextResponse } from "next/server";

const PREVIEW_COOKIE = "preview-access";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(req: Request) {
  const { pin, next } = await req.json() as { pin: string; next?: string };
  const expected = process.env.PREVIEW_PIN;

  const clean = (s: string) => s.replace(/[\s\u200B-\u200D\uFEFF\r\n]/g, "");
  if (!expected || clean(pin) !== clean(expected)) {
    return NextResponse.json({ error: "Wrong PIN" }, { status: 401 });
  }

  const redirect = next && next.startsWith("/") ? next : "/";
  const res = NextResponse.json({ ok: true, redirect });
  res.cookies.set(PREVIEW_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return res;
}
