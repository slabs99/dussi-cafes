import { NextResponse } from "next/server";

const OWNER  = "slabs99";
const REPO   = "dussi-cafes";
const BRANCH = "extra-features";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const filePath = `public/photos/${path.join("/")}`;
  const token = process.env.GITHUB_TOKEN;

  try {
    // Use raw GitHub URL — works immediately after commit, no redeploy needed
    const rawUrl = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${filePath}`;
    const res = await fetch(rawUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      next: { revalidate: 3600 },
    });

    if (!res.ok) return new NextResponse(null, { status: 404 });

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") ?? "image/jpeg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
