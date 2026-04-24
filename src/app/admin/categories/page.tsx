"use client";

import { useEffect, useState } from "react";

const ALL_CATEGORY_KEYS = [
  "new",
  "our-picks",
  "specialty-coffee",
  "bakery",
  "brunch",
  "roastery",
  "work-friendly",
  "late-evening",
] as const;

type CategoryKey = (typeof ALL_CATEGORY_KEYS)[number];
type CategoriesMeta = Record<CategoryKey, { label: string; enabled: boolean }>;

const DEFAULTS: CategoriesMeta = {
  "new":             { label: "New",             enabled: true  },
  "our-picks":       { label: "Our Picks",        enabled: true  },
  "specialty-coffee":{ label: "Specialty Coffee", enabled: true  },
  "bakery":          { label: "Bakery",           enabled: true  },
  "brunch":          { label: "Brunch",           enabled: true  },
  "roastery":        { label: "Roastery",         enabled: true  },
  "work-friendly":   { label: "Work-friendly",    enabled: true  },
  "late-evening":    { label: "Late Evening",     enabled: true  },
};

const DEFAULT_ORDER: CategoryKey[] = ["our-picks", "new", "brunch", "roastery", "work-friendly", "late-evening", "specialty-coffee", "bakery"];

const DEFAULT_OPTIONS = [
  { value: "our-picks",        label: "Curated Picks"    },
  { value: "new",              label: "New"              },
  { value: "brunch",           label: "Brunch"           },
  { value: "roastery",         label: "Roastery"         },
  { value: "work-friendly",    label: "Work-friendly"    },
  { value: "late-evening",     label: "Late Evening"     },
  { value: "specialty-coffee", label: "Specialty Coffee" },
  { value: "bakery",           label: "Bakery"           },
  { value: "",                 label: "All cafes"        },
];

export default function AdminCategoriesPage() {
  const [meta, setMeta] = useState<CategoriesMeta>(DEFAULTS);
  const [order, setOrder] = useState<CategoryKey[]>(DEFAULT_ORDER);
  const [defaultCategory, setDefaultCategory] = useState<string>("new");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data: Record<string, unknown>) => {
        setMeta({ ...DEFAULTS, ...(data as Partial<CategoriesMeta>) });
        setDefaultCategory(data.defaultCategory as string ?? "new");
        const savedOrder = data.order as CategoryKey[] | undefined;
        if (savedOrder?.length) setOrder(savedOrder);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...meta, defaultCategory, order }),
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

  function moveUp(index: number) {
    if (index === 0) return;
    setOrder((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveDown(index: number) {
    if (index === order.length - 1) return;
    setOrder((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
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

      <main className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-8">
        <p className="text-xs text-stone-400">
          Toggle, rename, and reorder filter categories. Set the default shown on page load. Changes go live within ~15 seconds.
        </p>

        {/* Default category selector */}
        <div className="bg-white border border-[#E0DDD9] px-5 py-4 flex flex-col gap-3">
          <div>
            <p className="text-[0.65rem] uppercase tracking-widest text-stone-400 mb-0.5">Default filter on page load</p>
            <p className="text-xs text-stone-400">Pre-selected when visitors open the site.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_OPTIONS.map((opt) => {
              const isActive = defaultCategory === opt.value;
              return (
                <button
                  key={opt.value || "__all__"}
                  onClick={() => setDefaultCategory(opt.value)}
                  className={`text-xs px-3 py-1.5 border rounded-lg transition-colors ${
                    isActive
                      ? "bg-[#2D6A4F] border-[#2D6A4F] text-white"
                      : "border-[#E0DDD9] text-stone-600 hover:border-stone-400"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category list with ordering */}
        {loading ? (
          <div className="text-sm text-stone-400 text-center py-16">Loading…</div>
        ) : (
          <div className="bg-white border border-[#E0DDD9]">
            <div className="grid grid-cols-[32px_48px_1fr_120px_40px] gap-3 items-center px-4 py-2.5 border-b border-[#E0DDD9] bg-stone-50/80">
              <span className="text-[0.65rem] uppercase tracking-widest text-stone-400">Order</span>
              <span className="text-[0.65rem] uppercase tracking-widest text-stone-400">On</span>
              <span className="text-[0.65rem] uppercase tracking-widest text-stone-400">Label shown on site</span>
              <span className="text-[0.65rem] uppercase tracking-widest text-stone-400">Key</span>
              <span />
            </div>

            <div className="divide-y divide-[#E0DDD9]">
              {order.map((key, index) => {
                const item = meta[key];
                if (!item) return null;
                const isDefault = defaultCategory === key;
                return (
                  <div
                    key={key}
                    className={`grid grid-cols-[32px_48px_1fr_120px_40px] gap-3 items-center px-4 py-3 transition-colors ${
                      item.enabled ? "" : "bg-stone-50/60"
                    }`}
                  >
                    {/* Up/Down */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="w-full flex items-center justify-center h-4 text-stone-300 hover:text-stone-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        aria-label="Move up"
                      >
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M1 5L4 2L7 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === order.length - 1}
                        className="w-full flex items-center justify-center h-4 text-stone-300 hover:text-stone-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        aria-label="Move down"
                      >
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M1 1L4 4L7 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>

                    {/* Toggle */}
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
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => rename(key, e.target.value)}
                        className={`flex-1 border border-[#E0DDD9] px-3 py-1.5 text-sm outline-none focus:border-[#2D6A4F] transition-colors ${
                          item.enabled ? "text-stone-800 bg-white" : "text-stone-400 bg-stone-50"
                        }`}
                      />
                      {isDefault && (
                        <span className="text-[0.6rem] uppercase tracking-wider bg-[#2D6A4F]/10 text-[#2D6A4F] px-1.5 py-0.5 flex-shrink-0">
                          Default
                        </span>
                      )}
                    </div>

                    {/* Key */}
                    <span className="text-[0.65rem] text-stone-300 font-mono truncate">{key}</span>

                    {/* Spacer */}
                    <span />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 text-sm text-[#2D6A4F] bg-[#2D6A4F]/8 px-4 py-3 border border-[#2D6A4F]/20">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {successMsg} — changes live within ~15 seconds
          </div>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </main>
    </div>
  );
}
