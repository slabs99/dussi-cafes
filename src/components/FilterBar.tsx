"use client";

import { useCallback, useRef, useState } from "react";
import type { FilterState, SortKey } from "@/lib/filters";
import type { Category } from "@/types/cafe";
import { useLanguage } from "@/context/LanguageContext";

interface CategoryMeta { label: string; enabled: boolean }

interface Props {
  filters: FilterState;
  totalCount: number;
  filteredCount: number;
  onChange: (next: Partial<FilterState>) => void;
  onClear: () => void;
  categoriesMeta?: Record<string, CategoryMeta>;
}

const selectCls = "text-sm text-stone-600 bg-transparent outline-none cursor-pointer hover:text-stone-900 transition-colors";

export default function FilterBar({
  filters,
  totalCount,
  filteredCount,
  onChange,
  onClear,
  categoriesMeta,
}: Props) {
  const { t } = useLanguage();
  const [searchOpen, setSearchOpen] = useState(!!filters.search);
  const inputRef = useRef<HTMLInputElement>(null);

  // All categories with fallback translation labels
  const ALL_CATEGORIES: { value: Category | ""; label: string }[] = [
    { value: "",                 label: t.allCafes },
    { value: "our-picks",        label: categoriesMeta?.["our-picks"]?.label        ?? t.catOurPicks        },
    { value: "specialty-coffee", label: categoriesMeta?.["specialty-coffee"]?.label ?? t.catSpecialtyCoffee },
    { value: "bakery",           label: categoriesMeta?.["bakery"]?.label           ?? t.catBakery          },
    { value: "brunch",           label: categoriesMeta?.["brunch"]?.label           ?? t.catBrunch          },
    { value: "roastery",         label: categoriesMeta?.["roastery"]?.label         ?? t.catRoastery        },
    { value: "work-friendly",    label: categoriesMeta?.["work-friendly"]?.label    ?? t.catWorkFriendly    },
    { value: "late-evening",     label: categoriesMeta?.["late-evening"]?.label     ?? t.catLateEvening     },
  ];

  // When meta is loaded, filter out disabled categories
  const CATEGORIES = categoriesMeta
    ? ALL_CATEGORIES.filter((c) => !c.value || categoriesMeta[c.value]?.enabled !== false)
    : ALL_CATEGORIES;

  const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: "rating",        label: t.sortTopRated     },
    { value: "alpha",         label: t.sortAtoZ         },
    { value: "most-reviewed", label: t.sortMostReviewed },
  ];

  const toggleSearch = useCallback(() => {
    if (searchOpen && !filters.search) {
      setSearchOpen(false);
    } else {
      setSearchOpen(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [searchOpen, filters.search]);

  return (
    <div className="sticky top-12 z-20 bg-[#F5F2EE]/90 backdrop-blur-md border-b border-[#E0DDD9]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3 sm:gap-4">

        {/* Search icon + expandable input */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={toggleSearch}
            aria-label="Search"
            className={`transition-colors ${searchOpen ? "text-[#2D6A4F]" : "text-stone-500 hover:text-stone-800"}`}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
          {searchOpen && (
            <input
              ref={inputRef}
              type="search"
              placeholder={t.search}
              value={filters.search}
              onChange={(e) => onChange({ search: e.target.value })}
              onBlur={() => { if (!filters.search) setSearchOpen(false); }}
              className="bg-transparent text-sm outline-none w-28 sm:w-36 placeholder:text-stone-400 text-stone-700 border-b border-stone-300 pb-0.5 focus:border-[#2D6A4F] transition-colors"
            />
          )}
        </div>

        {/* Divider */}
        <span className="h-4 w-px bg-stone-300 flex-shrink-0" />

        {/* Mobile: category dropdown */}
        <select
          value={filters.category}
          onChange={(e) => onChange({ category: e.target.value as Category | "" })}
          className={`${selectCls} flex-shrink-0 sm:hidden`}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        {/* Desktop: category tag buttons */}
        <div className="hidden sm:flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-none -mx-1 px-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => onChange({ category: c.value as Category | "" })}
              className={`flex-shrink-0 px-2.5 py-1 text-sm rounded-sm transition-colors ${
                filters.category === c.value
                  ? "text-[#2D6A4F] font-semibold bg-[#2D6A4F]/8"
                  : "text-stone-500 hover:text-stone-900"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Sort + count — right side */}
        <div className="ml-auto sm:ml-0 flex items-center gap-3 flex-shrink-0">
          <select
            value={filters.sort}
            onChange={(e) => onChange({ sort: e.target.value as SortKey })}
            className={selectCls}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <span className="text-sm text-stone-400 hidden sm:inline">
            {filteredCount === totalCount
              ? `${totalCount} ${t.places}`
              : `${filteredCount} ${t.of} ${totalCount} ${t.places}`}
          </span>
        </div>

      </div>
    </div>
  );
}
