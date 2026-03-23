"use client";

import { useCallback, useRef, useState } from "react";
import type { FilterState, SortKey } from "@/lib/filters";
import type { Category } from "@/types/cafe";

interface Props {
  filters: FilterState;
  totalCount: number;
  filteredCount: number;
  onChange: (next: Partial<FilterState>) => void;
  onClear: () => void;
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "specialty-coffee", label: "Specialty Coffee" },
  { value: "bakery",           label: "Bakery"           },
  { value: "brunch",           label: "Brunch"           },
  { value: "roastery",         label: "Roastery"         },
  { value: "work-friendly",    label: "Work-friendly"    },
  { value: "late-evening",     label: "Late Evening"     },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "rating",       label: "Top Rated"     },
  { value: "alpha",        label: "A to Z"        },
  { value: "most-reviewed",label: "Most Reviewed" },
];

export default function FilterBar({
  filters,
  totalCount,
  filteredCount,
  onChange,
  onClear,
}: Props) {
  const [searchOpen, setSearchOpen] = useState(!!filters.search);
  const inputRef = useRef<HTMLInputElement>(null);

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
    <div className="sticky top-0 z-10 bg-[#F5F2EE]/90 backdrop-blur-md border-b border-[#E0DDD9]">
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
              placeholder="Search..."
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
              className={
                filters.category === c.value
                  ? "text-xs uppercase tracking-wider font-semibold text-[#2D6A4F] underline underline-offset-4"
                  : "text-xs uppercase tracking-wider text-stone-500 hover:text-stone-800 transition-colors"
              }
            >
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
              Clear
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
              ? `${totalCount} places`
              : `${filteredCount} of ${totalCount} places`}
          </span>
        </div>
      </div>
    </div>
  );
}
