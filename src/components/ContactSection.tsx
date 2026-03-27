"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function ContactSection() {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");

    const formspreeId = process.env.NEXT_PUBLIC_FORMSPREE_ID;

    if (!formspreeId) {
      // Fallback: open mail client
      window.location.href = `mailto:hello@dussi.cafe?subject=Message from ${encodeURIComponent(name)}&body=${encodeURIComponent(message)}`;
      setStatus("success");
      return;
    }

    try {
      const res = await fetch(`https://formspree.io/f/${formspreeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      if (res.ok) {
        setStatus("success");
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="border-t border-[#E0DDD9]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="max-w-xl">
          {/* Header */}
          <div className="mb-8">
            <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-stone-900 leading-tight mb-2">
              {t.contactTitle}
            </h2>
            <p className="text-sm text-stone-500 leading-relaxed">{t.contactSub}</p>
          </div>

          {status === "success" ? (
            <div className="flex items-center gap-3 py-6">
              <div className="w-8 h-8 rounded-full bg-[#2D6A4F]/10 flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7L5.5 10L11.5 4" stroke="#2D6A4F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm text-stone-700">{t.contactSuccess}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.65rem] uppercase tracking-widest text-stone-400">
                    {t.contactName}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border border-[#E0DDD9] bg-white px-3 py-2.5 text-sm text-stone-800 outline-none focus:border-[#2D6A4F] transition-colors placeholder:text-stone-300"
                    placeholder="e.g. Anna"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.65rem] uppercase tracking-widest text-stone-400">
                    {t.contactEmail}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border border-[#E0DDD9] bg-white px-3 py-2.5 text-sm text-stone-800 outline-none focus:border-[#2D6A4F] transition-colors placeholder:text-stone-300"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[0.65rem] uppercase tracking-widest text-stone-400">
                  {t.contactMessage}
                </label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="border border-[#E0DDD9] bg-white px-3 py-2.5 text-sm text-stone-800 outline-none focus:border-[#2D6A4F] transition-colors resize-none placeholder:text-stone-300"
                  placeholder="Tell us anything…"
                />
              </div>

              {status === "error" && (
                <p className="text-xs text-red-500">{t.contactError}</p>
              )}

              <div>
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="bg-[#2D6A4F] text-white text-xs uppercase tracking-widest px-8 py-3 hover:bg-[#245a42] transition-colors disabled:opacity-40 flex items-center gap-2"
                >
                  {status === "sending" ? t.contactSending : t.contactSend}
                  {status !== "sending" && (
                    <span className="transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
