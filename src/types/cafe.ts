export type Category =
  | "specialty-coffee"
  | "bakery"
  | "brunch"
  | "roastery"
  | "work-friendly"
  | "late-evening"
  | "our-picks";

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
  openingHours: string | null;    // scraped status text e.g. "Temporarily closed"
  mapsUrl: string;
  address: string | null;
  coordinates: { lat: number; lng: number } | null;
  photoUrl: string | null;
  addedAt: string | null;
  comment: string | null;   // editorial note set from admin panel
  // Enriched via Google Places API (null until enrich script is run)
  placeId: string | null;
  weekdayHours: string[] | null;  // ["Monday: 8 AM – 6 PM", ...]
  website: string | null;
  phone: string | null;
}
