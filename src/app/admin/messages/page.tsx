"use client";

import { useEffect, useState } from "react";

interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  read: boolean;
  reply?: string;
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/messages")
      .then((r) => r.json())
      .then((data) => {
        setMessages(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function markRead(id: string, read: boolean) {
    setSaving(id);
    await fetch("/api/admin/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read }),
    });
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read } : m)));
    setSaving(null);
  }

  async function saveReply(id: string) {
    const reply = replyDraft[id] ?? "";
    setSaving(id);
    await fetch("/api/admin/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, reply }),
    });
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, reply } : m)));
    setSaving(null);
  }

  const unread = messages.filter((m) => !m.read).length;

  return (
    <div className="min-h-screen bg-[#F5F2EE]">
      <header className="border-b border-[#E0DDD9] bg-white">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/admin" className="text-xs text-stone-400 hover:text-stone-700 uppercase tracking-wider transition-colors">&larr; Admin</a>
            <span className="text-stone-300">|</span>
            <h1 className="font-playfair text-2xl font-bold text-stone-900">Messages</h1>
            {unread > 0 && (
              <span className="bg-[#2D6A4F] text-white text-xs px-2 py-0.5 rounded-full">{unread} unread</span>
            )}
          </div>
          <span className="text-xs text-stone-400">{messages.length} total</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-sm text-stone-400 text-center py-16">Loading…</div>
        ) : messages.length === 0 ? (
          <div className="text-sm text-stone-400 text-center py-16">No messages yet.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`bg-white border rounded-lg overflow-hidden transition-colors ${
                  msg.read ? "border-[#E0DDD9]" : "border-[#2D6A4F]/40"
                }`}
              >
                {/* Message header */}
                <button
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-stone-50 transition-colors"
                  onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {!msg.read && (
                        <span className="w-2 h-2 rounded-full bg-[#2D6A4F] flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium text-stone-900">{msg.name}</span>
                      {msg.email && (
                        <span className="text-xs text-stone-400">&lt;{msg.email}&gt;</span>
                      )}
                    </div>
                    <p className="text-sm text-stone-500 truncate">{msg.message}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {msg.reply && (
                      <span className="text-[0.65rem] uppercase tracking-wider text-stone-400">Replied</span>
                    )}
                    <span className="text-xs text-stone-400">
                      {new Date(msg.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                    <span className="text-stone-300">{expanded === msg.id ? "▲" : "▼"}</span>
                  </div>
                </button>

                {/* Expanded content */}
                {expanded === msg.id && (
                  <div className="border-t border-[#E0DDD9] px-5 py-4 flex flex-col gap-4">
                    <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{msg.message}</p>

                    {/* Reply box */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[0.65rem] uppercase tracking-widest text-stone-400">
                        Your reply note <span className="normal-case">(private, stored here only)</span>
                      </label>
                      <textarea
                        rows={3}
                        value={replyDraft[msg.id] ?? msg.reply ?? ""}
                        onChange={(e) =>
                          setReplyDraft((prev) => ({ ...prev, [msg.id]: e.target.value }))
                        }
                        className="w-full border border-[#E0DDD9] rounded px-3 py-2 text-sm text-stone-800 outline-none focus:border-[#2D6A4F] transition-colors resize-none"
                        placeholder="Add your reply or note…"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => saveReply(msg.id)}
                        disabled={saving === msg.id}
                        className="bg-[#2D6A4F] text-white text-xs uppercase tracking-widest px-5 py-2 rounded hover:bg-[#245a42] transition-colors disabled:opacity-40"
                      >
                        {saving === msg.id ? "Saving…" : "Save reply"}
                      </button>
                      <button
                        onClick={() => markRead(msg.id, !msg.read)}
                        disabled={saving === msg.id}
                        className="text-xs uppercase tracking-wider text-stone-500 hover:text-stone-800 transition-colors px-3 py-2 border border-[#E0DDD9] rounded"
                      >
                        {msg.read ? "Mark unread" : "Mark read"}
                      </button>
                      {msg.email && (
                        <a
                          href={`mailto:${msg.email}?subject=Re: your message on Düssi Cafes`}
                          className="text-xs uppercase tracking-wider text-[#2D6A4F] hover:underline ml-auto"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Reply via email →
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
