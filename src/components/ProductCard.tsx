"use client";

import { useLanguage } from "@/context/LanguageContext";

export interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  tags: string[];
  price: string;
  buyUrl: string;
  imageUrl: string | null;
  includes?: string[];
}

export default function ProductCard({
  product,
  index = 0,
}: {
  product: Product;
  index?: number;
}) {
  const { t } = useLanguage();

  return (
    <div
      className="group flex flex-col bg-white animate-card"
      style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
    >
      {/* Image */}
      <div
        className="relative overflow-hidden bg-[#EDE8E2] flex items-center justify-center"
        style={{ aspectRatio: "4/3" }}
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-stone-300">
              <rect x="3" y="3" width="22" height="22" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M3 18L9 12L13 16L18 10L25 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {/* Price badge */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-0.5 text-[0.65rem] font-semibold text-stone-800 tracking-wide">
          {product.price}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pt-3 pb-4 flex flex-col gap-1.5 flex-1">
        <p className="text-[0.65rem] uppercase tracking-widest text-stone-400">{product.brand}</p>
        <h3 className="font-playfair text-[1rem] leading-snug text-stone-900 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-[0.7rem] text-stone-500 leading-relaxed line-clamp-2 mt-0.5">
          {product.description}
        </p>

        {/* Includes (kits only) */}
        {product.includes && product.includes.length > 0 && (
          <div className="mt-1">
            <p className="text-[0.6rem] uppercase tracking-widest text-stone-400 mb-1">{t.includes}</p>
            <ul className="flex flex-col gap-0.5">
              {product.includes.slice(0, 3).map((item) => (
                <li key={item} className="text-[0.65rem] text-stone-500 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#2D6A4F] flex-shrink-0" />
                  {item}
                </li>
              ))}
              {product.includes.length > 3 && (
                <li className="text-[0.65rem] text-stone-400 italic ml-2.5">
                  +{product.includes.length - 3} more
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-1">
          {product.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[0.6rem] uppercase tracking-wide border border-[#E0DDD9] px-1.5 py-0.5 text-stone-400"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Shop link */}
        <a
          href={product.buyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto pt-3 flex items-center gap-1.5 text-[0.7rem] uppercase tracking-widest text-[#2D6A4F] font-medium hover:gap-2.5 transition-all duration-200"
        >
          {t.shopNow}
          <span className="transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
        </a>
      </div>
    </div>
  );
}
