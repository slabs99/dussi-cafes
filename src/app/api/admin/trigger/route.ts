import { NextResponse } from "next/server";

const OWNER = "slabs99";
const REPO = "dussi-cafes";

async function dispatchWorkflow(workflow: string) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return { ok: false, error: "GITHUB_TOKEN not set" };

  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${workflow}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref: "main" }),
    }
  );

  if (res.status === 204) return { ok: true };
  const text = await res.text();
  return { ok: false, error: text };
}

async function getLatestRun(workflow: string) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;

  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${workflow}/runs?per_page=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: { revalidate: 0 },
    }
  );

  if (!res.ok) return null;
  const data = await res.json();
  const run = data.workflow_runs?.[0];
  if (!run) return null;

  return {
    id: run.id as number,
    status: run.status as string,
    conclusion: run.conclusion as string | null,
    createdAt: run.created_at as string,
    url: run.html_url as string,
  };
}

export async function POST(req: Request) {
  const { workflow } = await req.json();
  if (!["sync.yml", "enrich.yml"].includes(workflow)) {
    return NextResponse.json({ error: "Unknown workflow" }, { status: 400 });
  }

  const result = await dispatchWorkflow(workflow);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  // Small delay then return initial run status
  await new Promise((r) => setTimeout(r, 2000));
  const run = await getLatestRun(workflow);
  return NextResponse.json({ ok: true, run });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const workflow = searchParams.get("workflow");
  if (!workflow) return NextResponse.json({ error: "Missing workflow" }, { status: 400 });

  const run = await getLatestRun(workflow);
  return NextResponse.json({ run });
}
