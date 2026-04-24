import type { Cafe, Category } from "@/types/cafe";

export type SortKey = "rating" | "alpha" | "most-reviewed";

export interface FilterState {
  category: Category | "";
  sort: SortKey;
  search: string;
}

export const DEFAULT_FILTERS: FilterState = {
  category: "new",
  sort: "rating",
  search: "",
};

export function applyFilters(cafes: Cafe[], filters: FilterState): Cafe[] {
  let result = cafes.filter((c) => {
    if (filters.category && !c.categories.includes(filters.category as Category)) return false;
    if (
      filters.search &&
      !c.name.toLowerCase().includes(filters.search.toLowerCase())
    )
      return false;
    return true;
  });

  result = [...result].sort((a, b) => {
    switch (filters.sort) {
      case "rating":
        return (b.rating ?? 0) - (a.rating ?? 0);
      case "alpha":
        return a.name.localeCompare(b.name);
      case "most-reviewed":
        return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
      default:
        return 0;
    }
  });

  return result;
}

export function filtersToParams(filters: FilterState): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.category) p.set("category", filters.category);
  if (filters.sort !== "rating") p.set("sort", filters.sort);
  if (filters.search) p.set("q", filters.search);
  return p;
}

export function paramsToFilters(params: URLSearchParams): FilterState {
  const cat = params.get("category");
  return {
    category: cat === null ? "new" : (cat as Category | ""),
    sort: (params.get("sort") as SortKey) || "rating",
    search: params.get("q") || "",
  };
}
