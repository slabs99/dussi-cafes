"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { LANG_NAMES, type LangCode } from "@/lib/translations";

const ACTIVE_LANGS: LangCode[] = ["en", "de", "nl", "es", "ar", "fr", "it", "pt"];

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-stone-500 hover:text-stone-800 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
          <ellipse cx="7" cy="7" rx="2.5" ry="5.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M1.5 5h11M1.5 9h11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <span>{LANG_NAMES[lang]}</span>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M1.5 3L4 5.5L6.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 bg-white border border-[#E0DDD9] shadow-lg min-w-[160px] py-1 z-50">
          {ACTIVE_LANGS.map((l) => (
            <button
              key={l}
              onClick={() => { setLang(l); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-xs hover:bg-stone-50 transition-colors ${
                l === lang ? "text-[#2D6A4F] font-medium" : "text-stone-700"
              }`}
            >
              {LANG_NAMES[l]}
            </button>
          ))}
          <div className="border-t border-[#E0DDD9] mt-1 pt-1">
            <p className="px-4 py-2 text-[0.65rem] text-stone-400 italic">More languages coming</p>
          </div>
        </div>
      )}
    </div>
  );
}
