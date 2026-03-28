import { NextResponse } from "next/server";

const OWNER = "slabs99";
const REPO = "dussi-cafes";
const BRANCH = "extra-features";

export async function POST(req: Request) {
  try {
    const token = process.env.GITHUB_TOKEN;
    const formData = await req.formData();
    const file = formData.get("photo") as File | null;
    const cafeId = formData.get("cafeId") as string | null;

    if (!file || !cafeId) {
      return NextResponse.json({ error: "Missing file or cafeId" }, { status: 400 });
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 8 MB)" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filePath = `public/photos/${cafeId}.${ext}`;
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    // Check if file already exists (need its SHA to update)
    const checkRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}?ref=${BRANCH}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cache: "no-store",
      }
    );
    const existingSha = checkRes.ok ? ((await checkRes.json()).sha as string) : undefined;

    const body: Record<string, string> = {
      message: `admin: upload photo for cafe ${cafeId}`,
      content: base64,
    };
    body.branch = BRANCH;
    if (existingSha) body.sha = existingSha;

    const putRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!putRes.ok) {
      const err = await putRes.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }

    return NextResponse.json({ photoUrl: `/photos/${cafeId}.${ext}` });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
