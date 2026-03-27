"use client";

import { useCallback, useRef, useState } from "react";
import type { FilterState, SortKey } from "@/lib/filters";
import type { Category } from "@/types/cafe";
import { useLanguage } from "@/context/LanguageContext";

interface Props {
  filters: FilterState;
  totalCount: number;
  filteredCount: number;
  onChange: (next: Partial<FilterState>) => void;
  onClear: () => void;
}

export default function FilterBar({
  filters,
  totalCount,
  filteredCount,
  onChange,
  onClear,
}: Props) {
  const { t } = useLanguage();
  const [searchOpen, setSearchOpen] = useState(!!filters.search);
  const inputRef = useRef<HTMLInputElement>(null);

  const CATEGORIES: { value: Category; label: string }[] = [
    { value: "our-picks",        label: t.catOurPicks        },
    { value: "specialty-coffee", label: t.catSpecialtyCoffee },
    { value: "bakery",           label: t.catBakery          },
    { value: "brunch",           label: t.catBrunch          },
    { value: "roastery",         label: t.catRoastery        },
    { value: "work-friendly",    label: t.catWorkFriendly    },
    { value: "late-evening",     label: t.catLateEvening     },
  ];

  const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: "rating",        label: t.sortTopRated      },
    { value: "alpha",         label: t.sortAtoZ          },
    { value: "most-reviewed", label: t.sortMostReviewed  },
  ];

  const toggleSearch = useCallback(() => {
    if (searchOpen && !filters.search) {
      setSearchOpen(false);
    } else {
      setSearchOpen(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [searchOpen, filters.search]);

  const toggleCategory = useCallback(
    (value: Category) => {
      onChange({ category: filters.category === value ? "" : value });
    },
    [filters.category, onChange]
  );

  const hasActiveFilters = filters.category || filters.search;

  return (
    <div className="sticky top-12 z-20 bg-[#F5F2EE]/90 backdrop-blur-md border-b border-[#E0DDD9]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-4 sm:gap-5 flex-wrap">

        {/* Search icon + expandable input */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSearch}
            aria-label="Search"
            className={`transition-colors ${searchOpen ? "text-[#2D6A4F]" : "text-stone-500 hover:text-stone-800"}`}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
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
              className="bg-transparent text-sm outline-none w-32 placeholder:text-stone-400 text-stone-700 border-b border-stone-300 pb-0.5 focus:border-[#2D6A4F] transition-colors"
            />
          )}
        </div>

        {/* Divider */}
        <span className="h-4 w-px bg-stone-300" />

        {/* Category filters */}
        <div className="flex gap-4 flex-wrap items-center">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => toggleCategory(c.value)}
              className={`flex items-center gap-1 transition-colors ${
                filters.category === c.value
                  ? "text-xs uppercase tracking-wider font-semibold text-[#2D6A4F] underline underline-offset-4"
                  : "text-xs uppercase tracking-wider text-stone-500 hover:text-stone-800"
              }`}
            >
              {c.value === "our-picks" && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className="flex-shrink-0">
                  <path d="M5 0.8L6.2 3.7L9.3 3.9L7 6L7.8 9.2L5 7.5L2.2 9.2L3 6L0.7 3.9L3.8 3.7Z" />
                </svg>
              )}
              {c.label}
            </button>
          ))}
        </div>

        {/* Clear */}
        {hasActiveFilters && (
          <>
            <span className="h-4 w-px bg-stone-300" />
            <button
              onClick={onClear}
              className="text-xs uppercase tracking-wider text-stone-500 hover:text-stone-800 transition-colors"
            >
              {t.clear}
            </button>
          </>
        )}

        {/* Sort + count — right side */}
        <div className="ml-auto flex items-center gap-3">
          <select
            value={filters.sort}
            onChange={(e) => onChange({ sort: e.target.value as SortKey })}
            className="text-xs uppercase tracking-wider text-stone-500 bg-transparent outline-none cursor-pointer hover:text-stone-800 transition-colors"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-stone-500">
            {filteredCount === totalCount
              ? `${totalCount} ${t.places}`
              : `${filteredCount} ${t.of} ${totalCount} ${t.places}`}
          </span>
        </div>
      </div>
    </div>
  );
}
