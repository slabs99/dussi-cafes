"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@/components/ProductCard";

type SectionKey = "beans" | "gear" | "kits" | "apparel";
interface SectionMeta { title: string; subtitle: string; enabled: boolean }
type AllMeta = Record<SectionKey, SectionMeta>;

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "beans",   label: "Coffee Beans"      },
  { key: "gear",    label: "Coffee Gear"        },
  { key: "kits",    label: "Barista Kits"       },
  { key: "apparel", label: "Apparel"            },
];

// ── Product edit modal ────────────────────────────────────────────────────────

function ProductModal({
  product,
  sectionKey,
  onClose,
  onSaved,
}: {
  product: Partial<Product> | null;
  sectionKey: SectionKey;
  onClose: () => void;
  onSaved: (p: Product) => void;
}) {
  const isNew = !product?.id;
  const [name,        setName]        = useState(product?.name        ?? "");
  const [brand,       setBrand]       = useState(product?.brand       ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [tags,        setTags]        = useState((product?.tags ?? []).join(", "));
  const [price,       setPrice]       = useState(product?.price       ?? "");
  const [buyUrl,      setBuyUrl]      = useState(product?.buyUrl      ?? "");
  const [imageUrl,    setImageUrl]    = useState(product?.imageUrl    ?? "");
  const [includes,    setIncludes]    = useState((product?.includes ?? []).join(", "));
  const [uploading,   setUploading]   = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { setError("Max 8 MB"); return; }
    setUploading(true);
    setError("");
    const form = new FormData();
    form.append("photo", file);
    form.append("cafeId", `${sectionKey}-${product?.id ?? name.toLowerCase().replace(/\s+/g, "-")}`);
    const res = await fetch("/api/admin/upload-photo", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) { setError(data.error ?? "Upload failed"); return; }
    setImageUrl(data.photoUrl);
  }

  async function handleSave() {
    if (!name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError("");

    const saved: Product = {
      id:          product?.id ?? name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name:        name.trim(),
      brand:       brand.trim(),
      description: description.trim(),
      tags:        tags.split(",").map((t) => t.trim()).filter(Boolean),
      price:       price.trim(),
      buyUrl:      buyUrl.trim(),
      imageUrl:    imageUrl.trim() || null,
      ...(includes.trim() ? { includes: includes.split(",").map((s) => s.trim()).filter(Boolean) } : {}),
    };

    onSaved(saved);
    setSaving(false);
    onClose();
  }

  const inputCls = "w-full border border-[#E0DDD9] px-3 py-2 text-sm text-stone-800 outline-none focus:border-[#2D6A4F] transition-colors bg-white";

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E0DDD9]">
          <h2 className="font-playfair text-lg font-bold text-stone-900">{isNew ? "Add product" : "Edit product"}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Image */}
          <div>
            <label className="text-[0.65rem] uppercase tracking-wider text-stone-400 block mb-2">Image</label>
            <div className="flex gap-3 items-start">
              <div className="w-20 flex-shrink-0 bg-[#EDE8E2] overflow-hidden" style={{ aspectRatio: "4/3" }}>
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[0.6rem] text-stone-300">No image</span>
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="text-xs uppercase tracking-wider border border-[#E0DDD9] px-3 py-1.5 text-stone-600 hover:border-stone-400 transition-colors disabled:opacity-40"
                >
                  {uploading ? "Uploading…" : "Upload photo"}
                </button>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Or paste image URL"
                  className={inputCls}
                />
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[0.65rem] uppercase tracking-wider text-stone-400 block mb-1.5">Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="e.g. V60 Ceramic Dripper" />
            </div>
            <div>
              <label className="text-[0.65rem] uppercase tracking-wider text-stone-400 block mb-1.5">Brand</label>
              <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className={inputCls} placeholder="e.g. Hario" />
            </div>
          </div>

          <div>
            <label className="text-[0.65rem] uppercase tracking-wider text-stone-400 block mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Short editorial description…" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[0.65rem] uppercase tracking-wider text-stone-400 block mb-1.5">Price</label>
              <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} placeholder="e.g. €14.50" />
            </div>
            <div>
              <label className="text-[0.65rem] uppercase tracking-wider text-stone-400 block mb-1.5">Tags <span className="normal-case text-stone-300">(comma-separated)</span></label>
              <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} placeholder="e.g. Ethiopia, Light Roast" />
            </div>
          </div>

          <div>
            <label className="text-[0.65rem] uppercase tracking-wider text-stone-400 block mb-1.5">Buy URL</label>
            <input type="url" value={buyUrl} onChange={(e) => setBuyUrl(e.target.value)} className={inputCls} placeholder="https://..." />
          </div>

          {sectionKey === "kits" && (
            <div>
              <label className="text-[0.65rem] uppercase tracking-wider text-stone-400 block mb-1.5">
                Includes <span className="normal-case text-stone-300">(comma-separated)</span>
              </label>
              <input type="text" value={includes} onChange={(e) => setIncludes(e.target.value)} className={inputCls} placeholder="e.g. Hario V60, 100 Filters, Kettle" />
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E0DDD9]">
          <button onClick={onClose} className="text-xs uppercase tracking-wider text-stone-500 hover:text-stone-800 transition-colors px-4 py-2">Cancel</button>
          <button onClick={handleSave} disabled={saving || uploading} className="bg-[#2D6A4F] text-white text-xs uppercase tracking-widest px-6 py-2.5 hover:bg-[#245a42] transition-colors disabled:opacity-40">
            {saving ? "Saving…" : isNew ? "Add product" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminLifestylePage() {
  const [activeSection, setActiveSection] = useState<SectionKey>("beans");
  const [products, setProducts] = useState<Record<SectionKey, Product[]>>({
    beans: [], gear: [], kits: [], apparel: [],
  });
  const [meta, setMeta] = useState<AllMeta>({
    beans:   { title: "Coffee Beans",      subtitle: "", enabled: true },
    gear:    { title: "Coffee Gear",        subtitle: "", enabled: true },
    kits:    { title: "Home Barista Kits",  subtitle: "", enabled: true },
    apparel: { title: "Apparel",            subtitle: "", enabled: true },
  });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [metaSaving, setMetaSaving] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null | "new">(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/lifestyle?section=beans").then((r) => r.json()),
      fetch("/api/admin/lifestyle?section=gear").then((r) => r.json()),
      fetch("/api/admin/lifestyle?section=kits").then((r) => r.json()),
      fetch("/api/admin/lifestyle?section=apparel").then((r) => r.json()),
      fetch("/api/admin/lifestyle?section=lifestyle-meta").then((r) => r.json()),
    ]).then(([beans, gear, kits, apparel, metaData]) => {
      setProducts({ beans, gear, kits, apparel });
      setMeta(metaData as AllMeta);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function flash(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  }

  async function saveMeta() {
    setMetaSaving(true);
    setError("");
    const res = await fetch("/api/admin/lifestyle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "lifestyle-meta", data: meta, message: "admin: update section metadata" }),
    });
    setMetaSaving(false);
    if (res.ok) flash("Section info saved");
    else setError("Failed to save metadata");
  }

  async function saveProducts(section: SectionKey, updated: Product[]) {
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/lifestyle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section, data: updated, message: `admin: update ${section}` }),
    });
    setSaving(false);
    if (res.ok) {
      setProducts((prev) => ({ ...prev, [section]: updated }));
      flash("Saved successfully");
    } else {
      setError("Save failed — try again");
    }
  }

  function handleProductSaved(saved: Product) {
    const current = products[activeSection];
    const idx = current.findIndex((p) => p.id === saved.id);
    const updated = idx >= 0
      ? current.map((p) => (p.id === saved.id ? saved : p))
      : [...current, saved];
    saveProducts(activeSection, updated);
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    const updated = products[activeSection].filter((p) => p.id !== id);
    saveProducts(activeSection, updated);
  }

  const currentProducts = products[activeSection];
  const currentMeta = meta[activeSection];

  return (
    <div className="min-h-screen bg-[#F5F2EE]">
      {/* Header */}
      <header className="border-b border-[#E0DDD9] bg-white">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/admin" className="text-xs text-stone-400 hover:text-stone-700 uppercase tracking-wider transition-colors">&larr; Admin</a>
            <span className="text-stone-300">|</span>
            <h1 className="font-playfair text-2xl font-bold text-stone-900">Lifestyle</h1>
          </div>
          <span className="text-xs text-stone-400">{currentProducts.length} products in {SECTIONS.find(s => s.key === activeSection)?.label}</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">

        {/* Section tabs */}
        <div className="flex gap-1 bg-white border border-[#E0DDD9] p-1 w-fit">
          {SECTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-colors flex items-center gap-2 ${
                activeSection === key
                  ? "bg-[#2D6A4F] text-white"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              {label}
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                meta[key]?.enabled !== false ? "bg-emerald-400" : "bg-stone-300"
              } ${activeSection === key ? "opacity-80" : ""}`} />
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-sm text-stone-400 text-center py-16">Loading…</div>
        ) : (
          <>
            {/* Section meta editor */}
            <div className="bg-white border border-[#E0DDD9] p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs uppercase tracking-widest text-stone-400">Section Info</h2>
                {/* Visible toggle */}
                <button
                  onClick={() => setMeta((m) => ({
                    ...m,
                    [activeSection]: { ...m[activeSection], enabled: !m[activeSection].enabled },
                  }))}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-wider border transition-colors ${
                    currentMeta.enabled
                      ? "border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                      : "border-stone-300 text-stone-500 bg-stone-50 hover:bg-stone-100"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${currentMeta.enabled ? "bg-emerald-500" : "bg-stone-300"}`} />
                  {currentMeta.enabled ? "Visible on site" : "Hidden from site"}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[0.65rem] uppercase tracking-wider text-stone-400 block mb-1.5">Section Title</label>
                  <input
                    type="text"
                    value={currentMeta.title}
                    onChange={(e) => setMeta((m) => ({ ...m, [activeSection]: { ...m[activeSection], title: e.target.value } }))}
                    className="w-full border border-[#E0DDD9] px-3 py-2 text-sm text-stone-800 outline-none focus:border-[#2D6A4F] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[0.65rem] uppercase tracking-wider text-stone-400 block mb-1.5">Subtitle</label>
                  <input
                    type="text"
                    value={currentMeta.subtitle}
                    onChange={(e) => setMeta((m) => ({ ...m, [activeSection]: { ...m[activeSection], subtitle: e.target.value } }))}
                    className="w-full border border-[#E0DDD9] px-3 py-2 text-sm text-stone-800 outline-none focus:border-[#2D6A4F] transition-colors"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={saveMeta}
                  disabled={metaSaving}
                  className="bg-[#2D6A4F] text-white text-xs uppercase tracking-widest px-5 py-2 hover:bg-[#245a42] transition-colors disabled:opacity-40"
                >
                  {metaSaving ? "Saving…" : "Save section info"}
                </button>
              </div>
            </div>

            {/* Products */}
            <div className="bg-white border border-[#E0DDD9]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E0DDD9]">
                <h2 className="text-xs uppercase tracking-widest text-stone-400">Products</h2>
                <button
                  onClick={() => setEditProduct("new")}
                  className="text-xs uppercase tracking-wider bg-[#2D6A4F] text-white px-4 py-1.5 hover:bg-[#245a42] transition-colors"
                >
                  + Add product
                </button>
              </div>

              {currentProducts.length === 0 ? (
                <div className="py-12 text-center text-sm text-stone-400">No products yet — add one above.</div>
              ) : (
                <div className="divide-y divide-[#E0DDD9]">
                  {currentProducts.map((product) => (
                    <div key={product.id} className="flex items-center gap-4 px-6 py-3 hover:bg-stone-50 transition-colors">
                      {/* Thumbnail */}
                      <div className="w-14 flex-shrink-0 bg-[#EDE8E2] overflow-hidden" style={{ aspectRatio: "4/3" }}>
                        {product.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : null}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-stone-900 truncate">{product.name}</p>
                          <span className="text-[0.65rem] text-stone-400 flex-shrink-0">{product.price}</span>
                        </div>
                        <p className="text-xs text-stone-400 truncate mt-0.5">
                          {product.brand} · {product.tags.slice(0, 3).join(", ")}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setEditProduct(product)}
                          className="text-xs uppercase tracking-wider text-stone-400 hover:text-stone-800 border border-[#E0DDD9] hover:border-stone-400 px-3 py-1.5 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-xs uppercase tracking-wider text-stone-400 hover:text-red-500 border border-[#E0DDD9] hover:border-red-300 px-3 py-1.5 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status messages */}
            {successMsg && (
              <div className="flex items-center gap-2 text-sm text-[#2D6A4F] bg-[#2D6A4F]/8 px-4 py-3 border border-[#2D6A4F]/20">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {successMsg} — site will redeploy in ~30 seconds
              </div>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            {saving && <p className="text-sm text-stone-400">Saving to GitHub…</p>}
          </>
        )}
      </main>

      {/* Product modal */}
      {editProduct !== null && (
        <ProductModal
          product={editProduct === "new" ? {} : editProduct}
          sectionKey={activeSection}
          onClose={() => setEditProduct(null)}
          onSaved={handleProductSaved}
        />
      )}
    </div>
  );
}
