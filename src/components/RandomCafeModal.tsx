"use client";

import { useEffect } from "react";
import type { Cafe } from "@/types/cafe";
import { useLanguage } from "@/context/LanguageContext";

const CATEGORY_KEYS: Record<string, keyof import("@/lib/translations").Translations> = {
  "specialty-coffee": "catSpecialtyCoffee",
  bakery:             "catBakery",
  brunch:             "catBrunch",
  roastery:           "catRoastery",
  "work-friendly":    "catWorkFriendly",
  "late-evening":     "catLateEvening",
  "our-picks":        "catOurPicks",
};

export default function RandomCafeModal({
  cafe,
  onClose,
  onNext,
}: {
  cafe: Cafe;
  onClose: () => void;
  onNext: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const rating = cafe.rating !== null ? cafe.rating.toFixed(1) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-sm rounded-xl overflow-hidden shadow-2xl animate-modal-spring"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Photo */}
        <div className="relative" style={{ aspectRatio: "4/3" }}>
          {cafe.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cafe.photoUrl}
              alt={cafe.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#EDE8E2] flex items-center justify-center">
              <span className="font-playfair text-3xl text-stone-300">{t.noPhoto}</span>
            </div>
          )}

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors text-sm"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Info */}
        <div className="px-5 pt-4 pb-5">
          <h2 className="font-playfair text-xl font-bold text-stone-900 leading-snug">
            {cafe.name}
          </h2>

          <div className="flex items-center gap-2 mt-1.5 text-[0.72rem] font-medium tracking-wide">
            {rating && <span className="text-[#2D6A4F] font-semibold">{rating}</span>}
            {rating && <span className="text-stone-300">/</span>}
            {rating && <span className="text-stone-500">5</span>}
            {rating && cafe.priceTier && <span className="text-stone-300">&middot;</span>}
            {cafe.priceTier && <span className="text-stone-600">{cafe.priceTier}</span>}
          </div>

          {cafe.address && (
            <p className="text-[0.72rem] text-stone-500 mt-1 truncate">
              {cafe.address.split(",")[0]}
            </p>
          )}

          {cafe.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {cafe.categories.map((cat) => (
                <span
                  key={cat}
                  className="text-[0.65rem] uppercase tracking-wider border border-[#E0DDD9] rounded-lg px-2 py-0.5 text-stone-500"
                >
                  {CATEGORY_KEYS[cat] ? t[CATEGORY_KEYS[cat]] : cat}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-3 mt-5">
            <a
              href={cafe.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-[#2D6A4F] text-white text-xs uppercase tracking-widest py-2.5 rounded-xl text-center hover:bg-[#245a42] transition-colors"
            >
              {t.openInMaps}
            </a>
            <button
              onClick={onNext}
              className="flex-1 border border-[#E0DDD9] text-xs uppercase tracking-widest py-2.5 rounded-xl text-stone-600 hover:border-stone-400 hover:text-stone-900 transition-colors"
            >
              {t.tryAnother}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
