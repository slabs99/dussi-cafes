"use client";

import { useEffect, useState } from "react";

const CATEGORY_KEYS = [
  "our-picks",
  "specialty-coffee",
  "bakery",
  "brunch",
  "roastery",
  "work-friendly",
  "late-evening",
] as const;

type CategoryKey = (typeof CATEGORY_KEYS)[number];
type CategoriesMeta = Record<CategoryKey, { label: string; enabled: boolean }>;

const DEFAULTS: CategoriesMeta = {
  "our-picks":        { label: "Our Picks",        enabled: true },
  "specialty-coffee": { label: "Specialty Coffee", enabled: true },
  "bakery":           { label: "Bakery",           enabled: true },
  "brunch":           { label: "Brunch",           enabled: true },
  "roastery":         { label: "Roastery",         enabled: true },
  "work-friendly":    { label: "Work-friendly",    enabled: true },
  "late-evening":     { label: "Late Evening",     enabled: true },
};

export default function AdminCategoriesPage() {
  const [meta, setMeta] = useState<CategoriesMeta>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => { setMeta({ ...DEFAULTS, ...data }); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(meta),
    });
    setSaving(false);
    if (res.ok) {
      setSuccessMsg("Saved");
      setTimeout(() => setSuccessMsg(""), 3000);
    } else {
      setError("Failed to save — try again");
    }
  }

  function toggle(key: CategoryKey) {
    setMeta((m) => ({ ...m, [key]: { ...m[key], enabled: !m[key].enabled } }));
  }

  function rename(key: CategoryKey, label: string) {
    setMeta((m) => ({ ...m, [key]: { ...m[key], label } }));
  }

  return (
    <div className="min-h-screen bg-[#F5F2EE]">
      <header className="border-b border-[#E0DDD9] bg-white">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/admin" className="text-xs text-stone-400 hover:text-stone-700 uppercase tracking-wider transition-colors">
              &larr; Admin
            </a>
            <span className="text-stone-300">|</span>
            <h1 className="font-playfair text-2xl font-bold text-stone-900">Categories</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-[#2D6A4F] text-white text-xs uppercase tracking-widest px-5 py-2 hover:bg-[#245a42] transition-colors disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <p className="text-xs text-stone-400 mb-6">
          Toggle categories on or off for the filter bar, and rename them. Changes go live within ~15 seconds.
        </p>

        {loading ? (
          <div className="text-sm text-stone-400 text-center py-16">Loading…</div>
        ) : (
          <div className="bg-white border border-[#E0DDD9]">
            {/* Column header */}
            <div className="grid grid-cols-[48px_1fr_140px] gap-4 items-center px-5 py-2.5 border-b border-[#E0DDD9] bg-stone-50/80">
              <span className="text-[0.65rem] uppercase tracking-widest text-stone-400">On</span>
              <span className="text-[0.65rem] uppercase tracking-widest text-stone-400">Label shown on site</span>
              <span className="text-[0.65rem] uppercase tracking-widest text-stone-400">Internal key</span>
            </div>

            <div className="divide-y divide-[#E0DDD9]">
              {CATEGORY_KEYS.map((key) => {
                const item = meta[key];
                return (
                  <div
                    key={key}
                    className={`grid grid-cols-[48px_1fr_140px] gap-4 items-center px-5 py-3 transition-colors ${
                      item.enabled ? "" : "bg-stone-50/60"
                    }`}
                  >
                    {/* Toggle switch */}
                    <button
                      onClick={() => toggle(key)}
                      aria-label={item.enabled ? "Disable" : "Enable"}
                      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                        item.enabled ? "bg-[#2D6A4F]" : "bg-stone-200"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                          item.enabled ? "translate-x-[18px]" : "translate-x-0.5"
                        }`}
                      />
                    </button>

                    {/* Label input */}
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => rename(key, e.target.value)}
                      className={`border border-[#E0DDD9] px-3 py-1.5 text-sm outline-none focus:border-[#2D6A4F] transition-colors ${
                        item.enabled ? "text-stone-800 bg-white" : "text-stone-400 bg-stone-50"
                      }`}
                    />

                    {/* Internal key */}
                    <span className="text-[0.65rem] text-stone-300 font-mono truncate">{key}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 flex items-center gap-2 text-sm text-[#2D6A4F] bg-[#2D6A4F]/8 px-4 py-3 border border-[#2D6A4F]/20">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {successMsg} — changes live within ~15 seconds
          </div>
        )}
        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
      </main>
    </div>
  );
}
