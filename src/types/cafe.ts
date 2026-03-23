export type Category =
  | "specialty-coffee"
  | "bakery"
  | "brunch"
  | "roastery"
  | "work-friendly"
  | "late-evening";

export type PriceTier = "€" | "€€" | "€€€";

export type CafeStatus = "open" | "closed" | "temporarily-closed";

export interface Cafe {
  id: string;
  name: string;
  categories: Category[];
  rating: number | null;
  reviewCount: number | null;
  priceTier: PriceTier | null;
  status: CafeStatus;
  openingHours: string | null;
  mapsUrl: string;
  address: string | null;
  coordinates: { lat: number; lng: number } | null;
  photoUrl: string | null;
  addedAt: string | null;
}
