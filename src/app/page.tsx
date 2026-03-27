"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Cafe } from "@/types/cafe";
import {
  applyFilters,
  DEFAULT_FILTERS,
  filtersToParams,
  paramsToFilters,
  type FilterState,
} from "@/lib/filters";
import FilterBar from "@/components/FilterBar";
import CafeCard from "@/components/CafeCard";
import RandomCafeModal from "@/components/RandomCafeModal";

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-6 sm:gap-x-8 sm:gap-y-12">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="flex flex-col">
          <div className="skeleton" style={{ aspectRatio: "4/3" }} />
          <div className="pt-4 flex flex-col gap-2">
            <div className="h-4 skeleton rounded w-3/4" />
            <div className="h-3 skeleton rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CoffeeBean({ style }: { style: React.CSSProperties }) {
  return (
    <span className="absolute" style={style} aria-hidden>
      <span className="coffee-bean">
        <svg width="14" height="20" viewBox="0 0 14 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="7" cy="10" rx="6" ry="9" fill="#2D6A4F" />
          <path d="M7 2 C5 6 5 14 7 18" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        </svg>
      </span>
    </span>
  );
}

const BEAN_POSITIONS: React.CSSProperties[] = [
  { top: "-22px", left: "6%",  transform: "rotate(20deg)",  transitionDelay: "0ms"   },
  { top: "-26px", left: "28%", transform: "rotate(-30deg)", transitionDelay: "55ms"  },
  { top: "-20px", left: "52%", transform: "rotate(10deg)",  transitionDelay: "30ms"  },
  { top: "-18px", right: "18%",transform: "rotate(-50deg)", transitionDelay: "80ms"  },
  { top: "18%",   left: "-24px",transform: "rotate(65deg)", transitionDelay: "110ms" },
  { top: "18%",   right: "-22px",transform: "rotate(-15deg)",transitionDelay: "70ms" },
  { bottom: "-22px", left: "22%", transform: "rotate(-20deg)", transitionDelay: "90ms"  },
  { bottom: "-20px", left: "55%", transform: "rotate(40deg)",  transitionDelay: "40ms"  },
  { bottom: "-18px", right: "12%",transform: "rotate(-60deg)", transitionDelay: "130ms" },
];

function CafeDirectory() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(() =>
    paramsToFilters(searchParams)
  );
  const [randomCafe, setRandomCafe] = useState<Cafe | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/data/cafes.json").then((r) => r.json()),
      fetch("/data/overrides.json").then((r) => r.json()).catch(() => ({})),
    ]).then(([rawCafes, overrides]: [Cafe[], Record<string, Partial<Cafe>>]) => {
      const merged = rawCafes.map((cafe) => {
        const ov = overrides[cafe.id];
        return ov ? { ...cafe, ...ov } : cafe;
      });
      setCafes(merged);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const params = filtersToParams(filters);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "/", { scroll: false });
  }, [filters, router]);

  const handleChange = useCallback((next: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...next }));
  }, []);

  const handleClear = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const filtered = applyFilters(cafes, filters);
  const totalCount = cafes.length;

  const openRandom = useCallback(() => {
    const pool = filtered.length > 0 ? filtered : cafes;
    if (!pool.length) return;
    setRandomCafe(pool[Math.floor(Math.random() * pool.length)]);
  }, [filtered, cafes]);

  const nextRandom = useCallback(() => {
    const pool = filtered.length > 0 ? filtered : cafes;
    if (pool.length < 2) return;
    setRandomCafe((prev) => {
      let next: Cafe;
      do { next = pool[Math.floor(Math.random() * pool.length)]; }
      while (next.id === prev?.id);
      return next;
    });
  }, [filtered, cafes]);

  return (
    <>
      {/* Hero header */}
      <header className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-8 sm:pb-10">
        <div className="flex items-end justify-between flex-wrap gap-6 sm:gap-8">
          {/* Title with coffee bean scatter on hover */}
          <div className="bean-host relative cursor-default select-none" style={{ width: "fit-content" }}>
            {BEAN_POSITIONS.map((style, i) => (
              <CoffeeBean key={i} style={style} />
            ))}
            <h1
              className="font-playfair font-bold leading-none text-stone-900"
              style={{ fontSize: "clamp(3.5rem, 8vw, 7rem)" }}
            >
              Düssi
              <br />
              Cafes.
            </h1>
          </div>

          <div className="pb-2 max-w-xs">
            <p className="text-xs uppercase tracking-widest text-stone-500 mb-2">
              Düsseldorf
            </p>
            <p className="text-stone-600 text-sm leading-relaxed mb-4">
              A personal guide to the best coffee spots, hand-picked by coffee lovers.
            </p>
            <button
              onClick={openRandom}
              disabled={loading}
              className="text-xs uppercase tracking-widest border border-[#2D6A4F] text-[#2D6A4F] px-4 py-2 hover:bg-[#2D6A4F] hover:text-white transition-colors disabled:opacity-40"
            >
              Surprise me
            </button>
          </div>

        </div>
        <div className="mt-10 border-t border-[#E0DDD9]" />
      </header>

      <FilterBar
        filters={filters}
        totalCount={totalCount}
        filteredCount={filtered.length}
        onChange={handleChange}
        onClear={handleClear}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {loading ? (
          <LoadingSkeleton />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 sm:py-24">
            <p className="font-playfair text-2xl text-stone-700 mb-3">
              No cafes match your filters
            </p>
            <button
              onClick={handleClear}
              className="text-sm text-stone-500 hover:text-[#2D6A4F] underline underline-offset-4 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-6 sm:gap-x-8 sm:gap-y-12">
            {filtered.map((cafe, i) => (
              <CafeCard key={cafe.id} cafe={cafe} index={i} />
            ))}
          </div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 border-t border-[#E0DDD9] text-center text-xs text-stone-500 tracking-wider">
        Made with love in Düsseldorf
      </footer>

      {randomCafe && (
        <RandomCafeModal
          cafe={randomCafe}
          onClose={() => setRandomCafe(null)}
          onNext={nextRandom}
        />
      )}
    </>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F5F2EE]">
      <Suspense>
        <CafeDirectory />
      </Suspense>
    </div>
  );
}
