import { NextResponse } from "next/server";

const OWNER = "slabs99";
const REPO = "dussi-cafes";
const BRANCH = "extra-features";
const FILE_PATH = "public/data/overrides.json";

async function getFileFromGitHub(): Promise<{ content: Record<string, unknown>; sha: string }> {
  const token = process.env.GITHUB_TOKEN;
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error(`GitHub GET failed: ${res.status}`);
  const data = await res.json();
  const content = JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));
  return { content, sha: data.sha as string };
}

async function commitToGitHub(content: Record<string, unknown>, sha: string, message: string) {
  const token = process.env.GITHUB_TOKEN;
  const encoded = Buffer.from(JSON.stringify(content, null, 2)).toString("base64");
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, content: encoded, sha, branch: BRANCH }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub PUT failed: ${err}`);
  }
}

export async function GET() {
  try {
    const { content } = await getFileFromGitHub();
    return NextResponse.json(content);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { cafeId, override } = await req.json() as {
      cafeId: string;
      override: { name?: string; photoUrl?: string; comment?: string };
    };

    const { content, sha } = await getFileFromGitHub();

    // Merge override — remove keys that are empty strings
    const cleaned = Object.fromEntries(
      Object.entries(override).filter(([, v]) => v !== "" && v !== null && v !== undefined)
    );

    if (Object.keys(cleaned).length === 0) {
      delete content[cafeId];
    } else {
      content[cafeId] = { ...(content[cafeId] as object ?? {}), ...cleaned };
    }

    await commitToGitHub(content, sha, `admin: update cafe ${cafeId}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// PATCH — bulk update multiple cafes in one commit
export async function PATCH(req: Request) {
  try {
    const { cafeIds, override, removeFields } = await req.json() as {
      cafeIds: string[];
      override?: Record<string, unknown>;
      removeFields?: string[];
    };

    const { content, sha } = await getFileFromGitHub();

    for (const cafeId of cafeIds) {
      const existing = (content[cafeId] as Record<string, unknown>) ?? {};

      let entry: Record<string, unknown> = { ...existing };

      if (override) {
        const cleaned = Object.fromEntries(
          Object.entries(override).filter(([, v]) => v !== "" && v !== null && v !== undefined)
        );
        entry = { ...entry, ...cleaned };
      }

      if (removeFields) {
        for (const field of removeFields) delete entry[field];
      }

      if (Object.keys(entry).length === 0) {
        delete content[cafeId];
      } else {
        content[cafeId] = entry;
      }
    }

    await commitToGitHub(content, sha, `admin: bulk update ${cafeIds.length} cafe(s)`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// DELETE a single field or whole override
export async function DELETE(req: Request) {
  try {
    const { cafeId, field } = await req.json() as { cafeId: string; field?: string };
    const { content, sha } = await getFileFromGitHub();

    if (field && content[cafeId]) {
      delete (content[cafeId] as Record<string, unknown>)[field];
      if (Object.keys(content[cafeId] as object).length === 0) delete content[cafeId];
    } else {
      delete content[cafeId];
    }

    await commitToGitHub(content, sha, `admin: clear override for ${cafeId}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
