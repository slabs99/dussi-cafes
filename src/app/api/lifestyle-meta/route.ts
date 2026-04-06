import { NextResponse } from "next/server";

const OWNER = "slabs99";
const REPO  = "dussi-cafes";
const BRANCH = "main";

export async function GET() {
  try {
    const token = process.env.GITHUB_TOKEN;
    const res = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/public/data/lifestyle-meta.json?ref=${BRANCH}`,
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        next: { revalidate: 15 }, // cache for 15 s — changes reflect within ~15 s
      }
    );
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    const data = await res.json();
    const content = JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));
    return NextResponse.json(content);
  } catch {
    // Fallback so the site never breaks
    return NextResponse.json({
      beans:   { enabled: true },
      gear:    { enabled: true },
      kits:    { enabled: true },
      apparel: { enabled: true },
    });
  }
}
