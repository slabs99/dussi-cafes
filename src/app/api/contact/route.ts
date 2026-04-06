import { NextResponse } from "next/server";

const OWNER = "slabs99";
const REPO = "dussi-cafes";
const BRANCH = "main";
const FILE_PATH = "public/data/messages.json";

interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  read: boolean;
  reply?: string;
}

async function getMessages(): Promise<{ messages: Message[]; sha: string }> {
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
  const messages = JSON.parse(Buffer.from(data.content, "base64").toString("utf-8")) as Message[];
  return { messages, sha: data.sha as string };
}

async function commitMessages(messages: Message[], sha: string) {
  const token = process.env.GITHUB_TOKEN;
  const encoded = Buffer.from(JSON.stringify(messages, null, 2)).toString("base64");
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
      body: JSON.stringify({
        message: "contact: new message submission",
        content: encoded,
        sha,
        branch: BRANCH,
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub PUT failed: ${err}`);
  }
}

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json() as {
      name: string;
      email: string;
      message: string;
    };

    if (!name?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Name and message are required" }, { status: 400 });
    }

    const { messages, sha } = await getMessages();

    const newMessage: Message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      email: email?.trim() ?? "",
      message: message.trim(),
      createdAt: new Date().toISOString(),
      read: false,
    };

    await commitMessages([newMessage, ...messages], sha);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
