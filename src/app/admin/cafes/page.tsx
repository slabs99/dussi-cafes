"use client";

import { useEffect, useRef, useState } from "react";
import type { Cafe, Category } from "@/types/cafe";

type Override = { name?: string; photoUrl?: string; comment?: string; categories?: Category[] };
type Overrides = Record<string, Override>;

const ALL_CATEGORIES: { value: Category; label: string }[] = [
  { value: "our-picks",        label: "Our Picks"        },
  { value: "specialty-coffee", label: "Specialty Coffee" },
  { value: "bakery",           label: "Bakery"           },
  { value: "brunch",           label: "Brunch"           },
  { value: "roastery",         label: "Roastery"         },
  { value: "work-friendly",    label: "Work-friendly"    },
  { value: "late-evening",     label: "Late Evening"     },
];

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  ALL_CATEGORIES.map(({ value, label }) => [value, label])
);

function EditModal({
  cafe,
  override,
  onClose,
  onSaved,
}: {
  cafe: Cafe;
  override: Override;
  onClose: () => void;
  onSaved: (cafeId: string, updated: Override) => void;
}) {
  const [name, setName] = useState(override.name ?? cafe.name);
  const [comment, setComment] = useState(override.comment ?? "");
  const [photoUrl, setPhotoUrl] = useState(override.photoUrl ?? cafe.photoUrl ?? "");
  const [categories, setCategories] = useState<Category[]>(
    override.categories ?? [...cafe.categories]
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [photoPreview, setPhotoPreview] = useState(override.photoUrl ?? cafe.photoUrl ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  function toggleCategory(cat: Category) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError("Photo must be under 8 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    setError("");
    const form = new FormData();
    form.append("photo", file);
    form.append("cafeId", cafe.id);

    const res = await fetch("/api/admin/upload-photo", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);

    if (!res.ok) {
      setError(data.error ?? "Upload failed");
      return;
    }
    setPhotoUrl(data.photoUrl);
  }

  async function handleSave() {
    setSaving(true);
    setError("");

    const ov: Override = {};
    if (name !== cafe.name) ov.name = name;
    if (comment) ov.comment = comment;
    if (photoUrl !== (cafe.photoUrl ?? "")) ov.photoUrl = photoUrl;

    // Save categories if they differ from the original
    const origSorted = [...cafe.categories].sort().join(",");
    const newSorted = [...categories].sort().join(",");
    if (origSorted !== newSorted) ov.categories = categories;

    const res = await fetch("/api/admin/overrides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cafeId: cafe.id, override: ov }),
    });

    setSaving(false);
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Save failed");
      return;
    }

    onSaved(cafe.id, ov);
    onClose();
  }

  async function handleClearComment() {
    setSaving(true);
    await fetch("/api/admin/overrides", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cafeId: cafe.id, field: "comment" }),
    });
    setSaving(false);
    setComment("");
    onSaved(cafe.id, { comment: undefined });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E0DDD9]">
          <h2 className="font-playfair text-lg font-bold text-stone-900">Edit cafe</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Photo */}
          <div>
            <label className="text-xs uppercase tracking-wider text-stone-400 block mb-2">Photo</label>
            <div className="flex gap-4 items-start">
              <div className="w-24 h-18 bg-[#EDE8E2] overflow-hidden flex-shrink-0" style={{ aspectRatio: "4/3", width: 96 }}>
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs text-stone-300">No photo</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="text-xs uppercase tracking-wider border border-[#E0DDD9] px-3 py-1.5 text-stone-600 hover:border-stone-400 transition-colors disabled:opacity-40"
                >
                  {uploading ? "Uploading…" : "Upload photo"}
                </button>
                <p className="text-[0.65rem] text-stone-400">JPG or PNG, max 8 MB</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs uppercase tracking-wider text-stone-400 block mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-[#E0DDD9] px-3 py-2.5 text-sm text-stone-800 outline-none focus:border-[#2D6A4F] transition-colors"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs uppercase tracking-wider text-stone-400 block mb-3">Tags</label>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map(({ value, label }) => {
                const active = categories.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleCategory(value)}
                    className={`text-xs px-3 py-1.5 border transition-colors ${
                      active
                        ? "bg-[#2D6A4F] border-[#2D6A4F] text-white"
                        : "border-[#E0DDD9] text-stone-600 hover:border-stone-400"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="text-xs uppercase tracking-wider text-stone-400 block mb-2">
              Comment <span className="normal-case text-stone-300">(shows on the site)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="e.g. Best croissants in the city. Gets busy on weekends."
              className="w-full border border-[#E0DDD9] px-3 py-2.5 text-sm text-stone-800 outline-none focus:border-[#2D6A4F] transition-colors resize-none placeholder:text-stone-300"
            />
            {override.comment && (
              <button onClick={handleClearComment} className="text-xs text-stone-400 hover:text-red-500 mt-1 transition-colors">
                Clear comment
              </button>
            )}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E0DDD9]">
          <button onClick={onClose} className="text-xs uppercase tracking-wider text-stone-500 hover:text-stone-800 transition-colors px-4 py-2">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="bg-[#2D6A4F] text-white text-xs uppercase tracking-widest px-6 py-2.5 hover:bg-[#245a42] transition-colors disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCafesPage() {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [overrides, setOverrides] = useState<Overrides>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Cafe | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/data/cafes.json").then((r) => r.json()),
      fetch("/api/admin/overrides").then((r) => r.json()).catch(() => ({})),
    ]).then(([cafesData, overridesData]: [Cafe[], Overrides]) => {
      setCafes(cafesData);
      setOverrides(overridesData);
      setLoading(false);
    });
  }, []);

  function handleSaved(cafeId: string, updated: Override) {
    setOverrides((prev) => ({
      ...prev,
      [cafeId]: { ...prev[cafeId], ...updated },
    }));
  }

  const filtered = cafes.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  const editingOverride = editing ? (overrides[editing.id] ?? {}) : {};

  return (
    <div className="min-h-screen bg-[#F5F2EE]">
      {/* Header */}
      <header className="border-b border-[#E0DDD9]">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/admin" className="text-xs text-stone-400 hover:text-stone-700 uppercase tracking-wider transition-colors">
              &larr; Admin
            </a>
            <span className="text-stone-300">|</span>
            <h1 className="font-playfair text-2xl font-bold text-stone-900">Cafes</h1>
          </div>
          <span className="text-xs text-stone-400">{cafes.length} cafes</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Search */}
        <input
          type="search"
          placeholder="Search cafes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-[#E0DDD9] px-4 py-3 text-sm text-stone-800 outline-none focus:border-[#2D6A4F] transition-colors placeholder:text-stone-400 mb-6"
        />

        {loading ? (
          <div className="text-sm text-stone-400 text-center py-12">Loading…</div>
        ) : (
          <div className="flex flex-col divide-y divide-[#E0DDD9] bg-white border border-[#E0DDD9]">
            {filtered.map((cafe) => {
              const ov = overrides[cafe.id];
              const displayName = ov?.name ?? cafe.name;
              const displayPhoto = ov?.photoUrl ?? cafe.photoUrl;
              const effectiveCategories = ov?.categories ?? cafe.categories;
              const hasOverride = !!ov && Object.keys(ov).length > 0;

              return (
                <div key={cafe.id} className="flex items-center gap-4 px-4 py-3 hover:bg-stone-50 transition-colors">
                  {/* Thumbnail */}
                  <div className="w-14 h-10 bg-[#EDE8E2] flex-shrink-0 overflow-hidden" style={{ aspectRatio: "4/3", width: 56 }}>
                    {displayPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={displayPhoto} alt="" className="w-full h-full object-cover" />
                    ) : null}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-stone-900 font-medium truncate">{displayName}</p>
                      {hasOverride && (
                        <span className="text-[0.6rem] uppercase tracking-wider bg-[#2D6A4F]/10 text-[#2D6A4F] px-1.5 py-0.5 flex-shrink-0">
                          Edited
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400 truncate mt-0.5">
                      {effectiveCategories.map((c) => CATEGORY_LABELS[c] ?? c).join(" · ")}
                      {ov?.comment && <span className="italic"> · &ldquo;{ov.comment.slice(0, 40)}{ov.comment.length > 40 ? "…" : ""}&rdquo;</span>}
                    </p>
                  </div>

                  {/* Edit button */}
                  <button
                    onClick={() => setEditing(cafe)}
                    className="text-xs uppercase tracking-wider text-stone-400 hover:text-stone-800 border border-[#E0DDD9] hover:border-stone-400 px-3 py-1.5 transition-colors flex-shrink-0"
                  >
                    Edit
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {editing && (
        <EditModal
          cafe={editing}
          override={editingOverride}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
