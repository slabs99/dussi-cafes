"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
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
import TopNav from "@/components/TopNav";
import CuratedSection from "@/components/CuratedSection";
import ContactSection from "@/components/ContactSection";
import type { Product } from "@/components/ProductCard";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-6 sm:gap-x-8 sm:gap-y-12">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="flex flex-col">
          <div className="skeleton animate-card" style={{ aspectRatio: "4/3", animationDelay: `${i * 60}ms` } as React.CSSProperties} />
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
  { top: "-22px", left: "6%",    transform: "rotate(20deg)",  transitionDelay: "0ms"   },
  { top: "-26px", left: "28%",   transform: "rotate(-30deg)", transitionDelay: "55ms"  },
  { top: "-20px", left: "52%",   transform: "rotate(10deg)",  transitionDelay: "30ms"  },
  { top: "-18px", right: "18%",  transform: "rotate(-50deg)", transitionDelay: "80ms"  },
  { top: "18%",   left: "-24px", transform: "rotate(65deg)",  transitionDelay: "110ms" },
  { top: "18%",   right: "-22px",transform: "rotate(-15deg)", transitionDelay: "70ms"  },
  { bottom: "-22px", left: "22%",  transform: "rotate(-20deg)", transitionDelay: "90ms"  },
  { bottom: "-20px", left: "55%",  transform: "rotate(40deg)",  transitionDelay: "40ms"  },
  { bottom: "-18px", right: "12%", transform: "rotate(-60deg)", transitionDelay: "130ms" },
];

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className={className}>
      <path d="M6 0.5L7.15 4.85L11.5 6L7.15 7.15L6 11.5L4.85 7.15L0.5 6L4.85 4.85L6 0.5Z" />
    </svg>
  );
}

const BURST_ANGLES = [0, 60, 120, 180, 240, 300];
const BURST_COLORS = ["#2D6A4F", "#4CAF7D", "#C8A96E", "#7CB9A0", "#2D6A4F", "#8FCA9C"];

function SparkleBurst({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <>
      {BURST_ANGLES.map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const tx = Math.round(Math.cos(rad) * 36);
        const ty = Math.round(Math.sin(rad) * 36);
        return (
          <div
            key={i}
            className="sparkle-particle"
            style={{
              "--tx": `${tx}px`,
              "--ty": `${ty}px`,
              color: BURST_COLORS[i],
              animationDelay: `${i * 25}ms`,
            } as React.CSSProperties}
          >
            ✦
          </div>
        );
      })}
    </>
  );
}

function CafeDirectory() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [beans, setBeans] = useState<Product[]>([]);
  const [gear, setGear] = useState<Product[]>([]);
  const [kits, setKits] = useState<Product[]>([]);
  const [apparel, setApparel] = useState<Product[]>([]);
  const [lifestyleMeta, setLifestyleMeta] = useState<Record<string, { title: string; subtitle: string; enabled?: boolean }>>({});
  const [categoriesMeta, setCategoriesMeta] = useState<Record<string, { label: string; enabled: boolean }> | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(() => paramsToFilters(searchParams));
  const [visibleCount, setVisibleCount] = useState(9);
  const [randomCafe, setRandomCafe] = useState<Cafe | null>(null);
  const [sparkling, setSparkling] = useState(false);
  const [btnAnimating, setBtnAnimating] = useState(false);
  const sparkleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    Promise.all([
      fetch("/data/cafes.json").then((r) => r.json()),
      fetch("/api/overrides").then((r) => r.json()).catch(() => ({})),
      fetch("/data/beans.json").then((r) => r.json()).catch(() => []),
      fetch("/data/gear.json").then((r) => r.json()).catch(() => []),
      fetch("/data/kits.json").then((r) => r.json()).catch(() => []),
      fetch("/data/apparel.json").then((r) => r.json()).catch(() => []),
      fetch("/api/lifestyle-meta").then((r) => r.json()).catch(() => ({})),
      fetch("/api/categories-meta").then((r) => r.json()).catch(() => undefined),
    ]).then(([rawCafes, overrides, beansData, gearData, kitsData, apparelData, metaData, catMeta]: [
      Cafe[], Record<string, Partial<Cafe> & { hidden?: boolean }>, Product[], Product[], Product[], Product[], Record<string, { title: string; subtitle: string }>, Record<string, { label: string; enabled: boolean }> | undefined
    ]) => {
      const merged = rawCafes
        .filter((cafe) => !(overrides[cafe.id]?.hidden))
        .map((cafe) => {
          const ov = overrides[cafe.id];
          return ov ? { ...cafe, ...ov } : cafe;
        });
      setCafes(merged);
      setBeans(beansData);
      setGear(gearData);
      setKits(kitsData);
      setApparel(apparelData);
      setLifestyleMeta(metaData);
      setCategoriesMeta(catMeta);
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
    setVisibleCount(9);
  }, []);

  const handleClear = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setVisibleCount(9);
  }, []);

  const filtered = applyFilters(cafes, filters);

  const openRandom = useCallback(() => {
    const pool = filtered.length > 0 ? filtered : cafes;
    if (!pool.length) return;
    setSparkling(true);
    setBtnAnimating(true);
    clearTimeout(sparkleTimer.current);
    sparkleTimer.current = setTimeout(() => setSparkling(false), 750);
    setTimeout(() => setBtnAnimating(false), 500);
    setRandomCafe(pool[Math.floor(Math.random() * pool.length)]);
  }, [filtered, cafes]);

  const nextRandom = useCallback(() => {
    const pool = filtered.length > 0 ? filtered : cafes;
    if (pool.length < 2) return;
    setSparkling(true);
    clearTimeout(sparkleTimer.current);
    sparkleTimer.current = setTimeout(() => setSparkling(false), 750);
    setRandomCafe((prev) => {
      let next: Cafe;
      do { next = pool[Math.floor(Math.random() * pool.length)]; }
      while (next.id === prev?.id);
      return next;
    });
  }, [filtered, cafes]);

  return (
    <>
      {/* Hero */}
      <header id="top" className="bg-[#F5F2EE] max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-16 pb-6 sm:pb-10">
        <div className="flex items-end justify-between flex-wrap gap-2 sm:gap-8">
          <div className="bean-host relative cursor-default select-none animate-fade-up" style={{ width: "fit-content" }}>
            {BEAN_POSITIONS.map((style, i) => <CoffeeBean key={i} style={style} />)}
            <h1
              className="font-playfair font-bold leading-none text-stone-900"
              style={{ fontSize: "clamp(3.5rem, 8vw, 7rem)" }}
            >
              Düssi
              <br />
              Cafes.
            </h1>
          </div>

          <div className="max-w-xs sm:pb-2 animate-fade-up" style={{ animationDelay: "80ms" }}>
            <p className="text-stone-600 text-sm leading-relaxed mb-3">{t.tagline}</p>
            <div className="relative inline-block">
              <SparkleBurst active={sparkling} />
              <button
                onClick={openRandom}
                disabled={loading}
                className={`flex items-center gap-2 text-xs uppercase tracking-widest border border-[#2D6A4F] text-[#2D6A4F] px-4 py-2 hover:bg-[#2D6A4F] hover:text-white transition-colors disabled:opacity-40 group ${
                  btnAnimating ? "animate-surprise-pop" : ""
                }`}
              >
                <SparkleIcon className="transition-transform group-hover:rotate-12 duration-300" />
                {t.surpriseMe}
              </button>
            </div>
          </div>
        </div>
        <div className="mt-6 sm:mt-10" />
      </header>

      {/* Filter bar */}
      <FilterBar
        filters={filters}
        totalCount={cafes.length}
        filteredCount={filtered.length}
        onChange={handleChange}
        onClear={handleClear}
        categoriesMeta={categoriesMeta}
      />

      {/* Cafe grid */}
      <section id="cafes" className="bg-[#F5F2EE] scroll-mt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {loading ? (
            <LoadingSkeleton />
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 sm:py-24 animate-fade-up">
              <p className="font-playfair text-2xl text-stone-700 mb-3">{t.noCafesMatch}</p>
              <button
                onClick={handleClear}
                className="text-sm text-stone-500 hover:text-[#2D6A4F] underline underline-offset-4 transition-colors"
              >
                {t.clearAllFilters}
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-6 sm:gap-x-8 sm:gap-y-12">
                {filtered.slice(0, visibleCount).map((cafe, i) => (
                  <CafeCard key={cafe.id} cafe={cafe} index={i} />
                ))}
              </div>
              <div className="text-center mt-10 sm:mt-14 flex items-center justify-center gap-4">
                {visibleCount < filtered.length && (
                  <button
                    onClick={() => setVisibleCount((n) => n + 9)}
                    className="text-xs uppercase tracking-widest border border-stone-300 text-stone-600 px-8 py-3 hover:border-[#2D6A4F] hover:text-[#2D6A4F] transition-colors"
                  >
                    {t.showMore}
                    <span className="ml-2 text-stone-400">
                      ({filtered.length - visibleCount} {t.left})
                    </span>
                  </button>
                )}
                {visibleCount > 9 && (
                  <button
                    onClick={() => {
                      setVisibleCount(9);
                      document.getElementById("cafes")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-xs uppercase tracking-widest border border-stone-300 text-stone-600 px-8 py-3 hover:border-stone-500 hover:text-stone-800 transition-colors"
                  >
                    {t.showLess}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Lifestyle sections — only after data loads */}
      {!loading && (
        <>
          {beans.length > 0 && lifestyleMeta.beans?.enabled !== false && (
            <CuratedSection
              id="beans"
              variant="white"
              title={lifestyleMeta.beans?.title ?? t.sectionBeans}
              subtitle={lifestyleMeta.beans?.subtitle ?? t.sectionBeansSub}
              products={beans.slice(0, 9)}
              icon={
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <ellipse cx="9" cy="9" rx="6.5" ry="8" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M9 1.5 C6.5 5.5 6.5 12.5 9 16.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
                </svg>
              }
            />
          )}

          {gear.length > 0 && lifestyleMeta.gear?.enabled !== false && (
            <CuratedSection
              id="gear"
              variant="cream"
              title={lifestyleMeta.gear?.title ?? t.sectionGear}
              subtitle={lifestyleMeta.gear?.subtitle ?? t.sectionGearSub}
              products={gear.slice(0, 9)}
              icon={
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M9 1.5v2.5M9 14v2.5M1.5 9H4M14 9h2.5M3.2 3.2l1.8 1.8M13 13l1.8 1.8M3.2 14.8l1.8-1.8M13 5l1.8-1.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              }
            />
          )}

          {kits.length > 0 && lifestyleMeta.kits?.enabled !== false && (
            <CuratedSection
              id="kits"
              variant="white"
              title={lifestyleMeta.kits?.title ?? t.sectionKits}
              subtitle={lifestyleMeta.kits?.subtitle ?? t.sectionKitsSub}
              products={kits.slice(0, 9)}
              icon={
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="2" y="6" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M6 6V5A3 3 0 0 1 12 5V6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  <path d="M6.5 11h5M9 8.5v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              }
            />
          )}

          {apparel.length > 0 && lifestyleMeta.apparel?.enabled !== false && (
            <CuratedSection
              id="apparel"
              variant="cream"
              title={lifestyleMeta.apparel?.title ?? t.sectionApparel}
              subtitle={lifestyleMeta.apparel?.subtitle ?? t.sectionApparelSub}
              products={apparel.slice(0, 9)}
              icon={
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M6.5 2.5L2 5.5V8.5H5V16H13V8.5H16V5.5L11.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6.5 2.5C6.5 2.5 7.5 4.5 9 4.5C10.5 4.5 11.5 2.5 11.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              }
            />
          )}

          <ContactSection />
        </>
      )}

      <footer className="bg-white border-t border-[#E0DDD9] text-center py-6 text-xs text-stone-400 tracking-wider">
        Made with ❤️ in Düsseldorf
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
    <LanguageProvider>
      <div className="min-h-screen bg-[#F5F2EE]">
        <TopNav />
        <Suspense>
          <CafeDirectory />
        </Suspense>
      </div>
    </LanguageProvider>
  );
}
