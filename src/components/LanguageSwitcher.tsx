"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { LANG_NAMES, LANG_FLAGS, type LangCode } from "@/lib/translations";

const ACTIVE_LANGS: LangCode[] = ["en", "de"];

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
    <div ref={ref} className="fixed top-4 right-4 z-50">
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-[#E0DDD9] shadow-sm px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 hover:border-stone-400 transition-all"
      >
        <span className="text-base leading-none">{LANG_FLAGS[lang]}</span>
        <span className="hidden sm:inline tracking-wide">{LANG_NAMES[lang]}</span>
        <svg
          width="8"
          height="8"
          viewBox="0 0 8 8"
          fill="none"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M1.5 3L4 5.5L6.5 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="animate-dropdown absolute top-full right-0 mt-1.5 bg-white border border-[#E0DDD9] shadow-lg min-w-[165px] py-1 z-50 origin-top-right">
          {ACTIVE_LANGS.map((l) => (
            <button
              key={l}
              onClick={() => { setLang(l); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 hover:bg-stone-50 transition-colors ${
                l === lang ? "text-[#2D6A4F] font-medium bg-[#2D6A4F]/5" : "text-stone-700"
              }`}
            >
              <span className="text-base leading-none">{LANG_FLAGS[l]}</span>
              <span>{LANG_NAMES[l]}</span>
              {l === lang && (
                <svg className="ml-auto" width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4.2 7.5L8 2.5" stroke="#2D6A4F" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
          <div className="border-t border-[#E0DDD9] mt-1 pt-1">
            <p className="px-3 py-1.5 text-[0.62rem] text-stone-400 italic">More languages coming</p>
          </div>
        </div>
      )}
    </div>
  );
}
