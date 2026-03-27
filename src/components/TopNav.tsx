"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { LANG_NAMES, LANG_FLAGS, type LangCode } from "@/lib/translations";

const ACTIVE_LANGS: LangCode[] = ["en", "de", "nl", "es", "ar", "fr", "it", "pt", "hi"];

type SectionKey = "beans" | "gear" | "kits" | "apparel";
const LIFESTYLE_SECTIONS: SectionKey[] = ["beans", "gear", "kits", "apparel"];

function scrollToSection(id: string) {
  if (id === "cafes") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  const el = document.getElementById(id);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - 56;
  window.scrollTo({ top: y, behavior: "smooth" });
}

export default function TopNav() {
  const { lang, t, setLang } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>("cafes");
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [enabledSections, setEnabledSections] = useState<Record<SectionKey, boolean>>({
    beans: true, gear: true, kits: true, apparel: true,
  });
  const langRef = useRef<HTMLDivElement>(null);

  // Load lifestyle-meta to know which sections are enabled
  useEffect(() => {
    fetch("/data/lifestyle-meta.json")
      .then((r) => r.json())
      .then((meta: Record<SectionKey, { enabled?: boolean }>) => {
        setEnabledSections({
          beans:   meta.beans?.enabled   !== false,
          gear:    meta.gear?.enabled    !== false,
          kits:    meta.kits?.enabled    !== false,
          apparel: meta.apparel?.enabled !== false,
        });
      })
      .catch(() => {/* keep defaults */});
  }, []);

  // Tab definitions — always show Cafes, lifestyle tabs depend on enabled state
  const tabs = [
    { id: "cafes",   label: t.tabCafes   },
    ...(enabledSections.beans   ? [{ id: "beans",   label: t.tabBeans   }] : []),
    ...(enabledSections.gear    ? [{ id: "gear",    label: t.tabGear    }] : []),
    ...(enabledSections.kits    ? [{ id: "kits",    label: t.tabKits    }] : []),
    ...(enabledSections.apparel ? [{ id: "apparel", label: t.tabApparel }] : []),
  ];

  // Shadow on scroll + active tab tracking
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
      const offsets = LIFESTYLE_SECTIONS
        .filter((id) => enabledSections[id])
        .map((id) => {
          const el = document.getElementById(id);
          return { id, top: el ? el.getBoundingClientRect().top : Infinity };
        });
      const inView = offsets.filter((o) => o.top <= 120);
      setActiveTab(inView.length === 0 ? "cafes" : inView[inView.length - 1].id);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [enabledSections]);

  // Close lang dropdown on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-30 bg-white/95 backdrop-blur-md transition-shadow duration-200 ${
        scrolled ? "shadow-[0_1px_12px_rgba(0,0,0,0.07)]" : "border-b border-[#E0DDD9]"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 flex items-center gap-4 sm:gap-6">

        {/* Logo */}
        <button
          onClick={() => scrollToSection("cafes")}
          className="font-playfair font-bold text-stone-900 text-lg leading-none flex-shrink-0 hover:text-[#2D6A4F] transition-colors"
        >
          Düssi.
        </button>

        {/* Divider */}
        <span className="h-4 w-px bg-stone-200 flex-shrink-0" />

        {/* Section tabs */}
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none flex-1 -mx-1 px-1">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => { scrollToSection(id); setActiveTab(id); }}
              className={`flex-shrink-0 px-3 py-1.5 text-xs uppercase tracking-wider transition-colors rounded-sm ${
                activeTab === id
                  ? "text-[#2D6A4F] font-semibold bg-[#2D6A4F]/8"
                  : "text-stone-500 hover:text-stone-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Language switcher */}
        <div ref={langRef} className="relative flex-shrink-0">
          <button
            onClick={() => setLangOpen((o) => !o)}
            className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 transition-colors py-1 px-2"
          >
            <span className="text-base leading-none">{LANG_FLAGS[lang]}</span>
            <span className="hidden sm:inline tracking-wide">{LANG_NAMES[lang]}</span>
            <svg
              width="8" height="8" viewBox="0 0 8 8" fill="none"
              className={`transition-transform duration-200 ${langOpen ? "rotate-180" : ""}`}
            >
              <path d="M1.5 3L4 5.5L6.5 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {langOpen && (
            <div className="animate-dropdown absolute top-full right-0 mt-1 bg-white border border-[#E0DDD9] shadow-lg min-w-[160px] py-1 z-50 origin-top-right">
              {ACTIVE_LANGS.map((l) => (
                <button
                  key={l}
                  onClick={() => { setLang(l); setLangOpen(false); }}
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
                <p className="px-3 py-1.5 text-[0.62rem] text-stone-400 italic">
                  {t.moreLanguagesComing}
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}
