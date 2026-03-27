"use client";

import type { Cafe } from "@/types/cafe";

export default function CafeCard({
  cafe,
  index = 0,
}: {
  cafe: Cafe;
  index?: number;
}) {
  const rating = cafe.rating !== null ? cafe.rating.toFixed(1) : null;
  const priceTier = cafe.priceTier ?? null;
  const address = cafe.address ?? null;

  const status = cafe.status;
  let statusColor = "";
  let statusLabel = "";
  if (status === "closed") {
    statusLabel = "Permanently closed";
    statusColor = "text-stone-400 line-through";
  } else if (status === "temporarily-closed") {
    statusLabel = "Temporarily closed";
    statusColor = "text-amber-700";
  }

  const hoursDisplay =
    cafe.openingHours && cafe.openingHours.length > 4
      ? cafe.openingHours
      : statusLabel;

  return (
    <a
      href={cafe.mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col animate-fade-up bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.10)]"
      style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
    >
      {/* Photo */}
      <div
        className="relative overflow-hidden bg-[#EDE8E2]"
        style={{ aspectRatio: "4/3" }}
      >
        {cafe.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cafe.photoUrl}
            alt={cafe.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-playfair text-3xl text-stone-300">
              No photo
            </span>
          </div>
        )}

        {/* Subtle arrow on hover */}
        <div className="absolute inset-0 flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-white text-[0.7rem] uppercase tracking-widest font-medium bg-black/60 px-3 py-1.5 flex items-center gap-1.5">
            Open in Maps
            <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="px-4 pt-3 pb-4 flex flex-col gap-1">
        <h2 className="font-playfair text-[1.05rem] leading-snug text-stone-900 line-clamp-1">
          {cafe.name}
        </h2>

        <div className="flex items-center gap-2 text-[0.7rem] font-medium tracking-wide">
          {rating && <span className="text-[#2D6A4F] font-semibold">{rating}</span>}
          {rating && <span className="text-stone-300">/</span>}
          {rating && <span className="text-stone-500">5</span>}
          {rating && priceTier && <span className="text-stone-300">&middot;</span>}
          {priceTier && <span className="text-stone-600">{priceTier}</span>}
        </div>

        {address && (
          <p className="text-[0.7rem] text-stone-500 truncate leading-snug">
            {address.split(",")[0]}
          </p>
        )}

        {hoursDisplay && (
          <p className={`text-[0.7rem] truncate leading-snug ${statusColor || "text-stone-500"}`}>
            {hoursDisplay}
          </p>
        )}

        {cafe.comment && (
          <p className="text-[0.7rem] text-stone-400 italic leading-snug line-clamp-2 mt-0.5">
            {cafe.comment}
          </p>
        )}
      </div>
    </a>
  );
}
