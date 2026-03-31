"use client";

import { useEffect, useRef, useState } from "react";
import type { Cafe, Category } from "@/types/cafe";

type Override = { name?: string; photoUrl?: string; comment?: string; categories?: Category[]; hidden?: boolean };
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
    if (file.size > 8 * 1024 * 1024) { setError("Photo must be under 8 MB"); return; }
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
    if (!res.ok) { setError(data.error ?? "Upload failed"); return; }
    setPhotoUrl(data.photoUrl);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    const ov: Override = {};
    if (name !== cafe.name) ov.name = name;
    if (comment) ov.comment = comment;
    if (photoUrl !== (cafe.photoUrl ?? "")) ov.photoUrl = photoUrl;
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
    if (!res.ok) { setError(data.error ?? "Save failed"); return; }
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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E0DDD9]">
          <h2 className="font-playfair text-lg font-bold text-stone-900">Edit cafe</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Photo */}
          <div>
            <label className="text-xs uppercase tracking-wider text-stone-400 block mb-2">Photo</label>
            <div className="flex gap-4 items-start">
              <div className="w-24 bg-[#EDE8E2] overflow-hidden flex-shrink-0" style={{ aspectRatio: "4/3", width: 96 }}>
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
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="text-xs uppercase tracking-wider border border-[#E0DDD9] rounded-lg px-3 py-1.5 text-stone-600 hover:border-stone-400 transition-colors disabled:opacity-40">
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
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border border-[#E0DDD9] rounded-lg px-3 py-2.5 text-sm text-stone-800 outline-none focus:border-[#2D6A4F] transition-colors" />
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs uppercase tracking-wider text-stone-400 block mb-3">Tags</label>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map(({ value, label }) => {
                const active = categories.includes(value);
                return (
                  <button key={value} type="button" onClick={() => toggleCategory(value)}
                    className={`text-xs px-3 py-1.5 border rounded-lg transition-colors ${
                      active ? "bg-[#2D6A4F] border-[#2D6A4F] text-white" : "border-[#E0DDD9] text-stone-600 hover:border-stone-400"
                    }`}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recommendation / Comment */}
          <div>
            <label className="text-xs uppercase tracking-wider text-stone-400 block mb-2">
              Why we recommend it <span className="normal-case text-stone-300">(shows under the cafe name)</span>
            </label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
              placeholder="e.g. Best croissants in the city. Gets busy on weekends."
              className="w-full border border-[#E0DDD9] rounded-lg px-3 py-2.5 text-sm text-stone-800 outline-none focus:border-[#2D6A4F] transition-colors resize-none placeholder:text-stone-300" />
            {override.comment && (
              <button onClick={handleClearComment} className="text-xs text-stone-400 hover:text-red-500 mt-1 transition-colors">
                Clear comment
              </button>
            )}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E0DDD9]">
          <button onClick={onClose} className="text-xs uppercase tracking-wider text-stone-500 hover:text-stone-800 transition-colors px-4 py-2 rounded-lg">Cancel</button>
          <button onClick={handleSave} disabled={saving || uploading}
            className="bg-[#2D6A4F] text-white text-xs uppercase tracking-widest px-6 py-2.5 rounded-lg hover:bg-[#245a42] transition-colors disabled:opacity-40">
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

  // Multi-select
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tagPanelOpen, setTagPanelOpen] = useState(false);
  const [pendingTags, setPendingTags] = useState<Set<Category>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);

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
    setOverrides((prev) => ({ ...prev, [cafeId]: { ...prev[cafeId], ...updated } }));
  }

  const filtered = cafes.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  const allSelectedOnPage = filtered.length > 0 && filtered.every((c) => selected.has(c.id));

  function toggleSelectAll() {
    if (allSelectedOnPage) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((c) => c.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function bulkPatch(ids: string[], patch?: Partial<Override>, removeFields?: string[]) {
    setBulkSaving(true);
    const res = await fetch("/api/admin/overrides", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cafeIds: ids, override: patch, removeFields }),
    });
    setBulkSaving(false);
    if (!res.ok) { alert("Failed — try again"); return false; }
    setOverrides((prev) => {
      const next = { ...prev };
      for (const id of ids) {
        let entry = { ...next[id] };
        if (patch) entry = { ...entry, ...patch };
        if (removeFields) removeFields.forEach((f) => delete entry[f as keyof Override]);
        if (Object.keys(entry).length === 0) delete next[id]; else next[id] = entry;
      }
      return next;
    });
    setSelected(new Set());
    setTagPanelOpen(false);
    return true;
  }

  async function handleBulkHide() {
    const ids = [...selected];
    if (!confirm(`Hide ${ids.length} cafe${ids.length > 1 ? "s" : ""} from the site?`)) return;
    await bulkPatch(ids, { hidden: true });
  }

  async function handleBulkShow() {
    await bulkPatch([...selected], undefined, ["hidden"]);
  }

  async function handleBulkAssignTags() {
    await bulkPatch([...selected], { categories: [...pendingTags] as Category[] });
  }

  const selectedIds = [...selected];
  const allSelectedHidden = selectedIds.length > 0 && selectedIds.every((id) => overrides[id]?.hidden);
  const editingOverride = editing ? (overrides[editing.id] ?? {}) : {};

  return (
    <div className="min-h-screen bg-[#F5F2EE]">
      <header className="border-b border-[#E0DDD9] bg-white">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/admin" className="text-xs text-stone-400 hover:text-stone-700 uppercase tracking-wider transition-colors">&larr; Admin</a>
            <span className="text-stone-300">|</span>
            <h1 className="font-playfair text-2xl font-bold text-stone-900">Cafes</h1>
          </div>
          <span className="text-xs text-stone-400">{cafes.length} cafes</span>
        </div>
      </header>

      <main className={`max-w-4xl mx-auto px-6 py-8 ${selected.size > 0 ? "pb-28" : ""}`}>
        <input
          type="search"
          placeholder="Search cafes…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSelected(new Set()); }}
          className="w-full bg-white border border-[#E0DDD9] rounded-xl px-4 py-3 text-sm text-stone-800 outline-none focus:border-[#2D6A4F] transition-colors placeholder:text-stone-400 mb-6"
        />

        {loading ? (
          <div className="text-sm text-stone-400 text-center py-12">Loading…</div>
        ) : (
          <div className="flex flex-col bg-white border border-[#E0DDD9]">
            {/* Select-all header */}
            {filtered.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#E0DDD9] bg-stone-50/80">
                <input
                  type="checkbox"
                  checked={allSelectedOnPage}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 accent-[#2D6A4F] cursor-pointer"
                />
                <span className="text-xs text-stone-400 select-none">
                  {selected.size > 0 ? `${selected.size} of ${filtered.length} selected` : "Select all"}
                </span>
              </div>
            )}

            <div className="divide-y divide-[#E0DDD9]">
              {filtered.map((cafe) => {
                const ov = overrides[cafe.id];
                const displayName = ov?.name ?? cafe.name;
                const displayPhoto = ov?.photoUrl ?? cafe.photoUrl;
                const effectiveCategories = ov?.categories ?? cafe.categories;
                const hasEdits = !!ov && Object.keys(ov).some((k) => k !== "hidden");
                const isHidden = ov?.hidden === true;
                const isSelected = selected.has(cafe.id);

                return (
                  <div
                    key={cafe.id}
                    onClick={() => toggleSelect(cafe.id)}
                    className={`flex items-center gap-4 px-4 py-3 transition-colors cursor-pointer ${
                      isSelected ? "bg-[#2D6A4F]/5" : "hover:bg-stone-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(cafe.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 accent-[#2D6A4F] flex-shrink-0 cursor-pointer"
                    />

                    <div
                      className={`flex-shrink-0 bg-[#EDE8E2] overflow-hidden transition-opacity ${isHidden ? "opacity-40" : ""}`}
                      style={{ aspectRatio: "4/3", width: 56 }}
                    >
                      {displayPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={displayPhoto} alt="" className="w-full h-full object-cover" />
                      ) : null}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium truncate ${isHidden ? "text-stone-400 line-through" : "text-stone-900"}`}>
                          {displayName}
                        </p>
                        {isHidden && (
                          <span className="text-[0.6rem] uppercase tracking-wider bg-red-50 text-red-400 px-1.5 py-0.5 flex-shrink-0 border border-red-100">
                            Hidden
                          </span>
                        )}
                        {hasEdits && !isHidden && (
                          <span className="text-[0.6rem] uppercase tracking-wider bg-[#2D6A4F]/10 text-[#2D6A4F] px-1.5 py-0.5 flex-shrink-0">
                            Edited
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 truncate mt-0.5">
                        {effectiveCategories.map((c) => CATEGORY_LABELS[c] ?? c).join(" · ")}
                        {ov?.comment && (
                          <span className="italic">
                            {" "}· &ldquo;{ov.comment.slice(0, 40)}{ov.comment.length > 40 ? "…" : ""}&rdquo;
                          </span>
                        )}
                      </p>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); setEditing(cafe); }}
                      className="text-xs uppercase tracking-wider text-stone-400 hover:text-stone-800 border border-[#E0DDD9] hover:border-stone-400 rounded-lg px-3 py-1.5 transition-colors flex-shrink-0"
                    >
                      Edit
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Floating action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E0DDD9] shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
            <span className="text-sm font-medium text-stone-900">{selected.size} selected</span>
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-stone-400 hover:text-stone-700 transition-colors"
            >
              Clear
            </button>

            <div className="ml-auto flex items-center gap-3 relative">
              {/* Tag assignment panel */}
              {tagPanelOpen && (
                <div className="absolute bottom-full right-0 mb-3 bg-white border border-[#E0DDD9] rounded-xl shadow-xl p-4 w-72 z-50">
                  <p className="text-[0.65rem] uppercase tracking-widest text-stone-400 mb-3">
                    Assign tags to {selected.size} cafe{selected.size > 1 ? "s" : ""}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {ALL_CATEGORIES.map(({ value, label }) => {
                      const active = pendingTags.has(value);
                      return (
                        <button
                          key={value}
                          onClick={() => setPendingTags((prev) => {
                            const next = new Set(prev);
                            if (next.has(value)) next.delete(value); else next.add(value);
                            return next;
                          })}
                          className={`text-xs px-3 py-1.5 border rounded-lg transition-colors ${
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
                  <p className="text-[0.65rem] text-stone-400 mb-3">
                    This will replace existing tags on all selected cafes.
                  </p>
                  <button
                    onClick={handleBulkAssignTags}
                    disabled={pendingTags.size === 0 || bulkSaving}
                    className="w-full bg-[#2D6A4F] text-white text-xs uppercase tracking-widest py-2.5 rounded-lg hover:bg-[#245a42] transition-colors disabled:opacity-40"
                  >
                    {bulkSaving ? "Saving…" : `Apply to ${selected.size} cafe${selected.size > 1 ? "s" : ""}`}
                  </button>
                </div>
              )}

              <button
                onClick={() => { setTagPanelOpen((o) => !o); setPendingTags(new Set()); }}
                className={`text-xs uppercase tracking-wider border rounded-lg px-4 py-2 transition-colors ${
                  tagPanelOpen
                    ? "border-[#2D6A4F] bg-[#2D6A4F] text-white"
                    : "border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#2D6A4F] hover:text-white"
                }`}
              >
                Assign tags
              </button>

              {allSelectedHidden ? (
                <button
                  onClick={handleBulkShow}
                  disabled={bulkSaving}
                  className="text-xs uppercase tracking-wider border border-emerald-300 rounded-lg text-emerald-700 px-4 py-2 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-colors disabled:opacity-40"
                >
                  Show on site
                </button>
              ) : (
                <button
                  onClick={handleBulkHide}
                  disabled={bulkSaving}
                  className="text-xs uppercase tracking-wider border border-red-200 rounded-lg text-red-500 px-4 py-2 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors disabled:opacity-40"
                >
                  Hide from site
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
