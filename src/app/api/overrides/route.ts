import { NextResponse } from "next/server";

const OWNER  = "slabs99";
const REPO   = "dussi-cafes";
const BRANCH = "extra-features";

export async function GET() {
  try {
    const token = process.env.GITHUB_TOKEN;
    const res = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/public/data/overrides.json?ref=${BRANCH}`,
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        next: { revalidate: 15 },
      }
    );
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    const data = await res.json();
    const content = JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));
    return NextResponse.json(content);
  } catch {
    return NextResponse.json({});
  }
}
