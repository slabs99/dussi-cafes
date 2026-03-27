import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminDashboard from "./AdminDashboard";
import cafesData from "../../../public/data/cafes.json";
import type { Cafe } from "@/types/cafe";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;
  if (!token || token !== process.env.ADMIN_SECRET) redirect("/admin/login");

  const cafes = cafesData as Cafe[];
  const stats = {
    total: cafes.length,
    withPhoto: cafes.filter((c) => c.photoUrl).length,
    withRating: cafes.filter((c) => c.rating !== null).length,
    enriched: cafes.filter((c) => c.placeId).length,
    categories: Object.entries(
      cafes.reduce<Record<string, number>>((acc, c) => {
        c.categories.forEach((cat) => { acc[cat] = (acc[cat] ?? 0) + 1; });
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1]),
    lastSync: cafes[0]?.addedAt ?? null,
  };

  const hasGithubToken = !!process.env.GITHUB_TOKEN;
  const hasPlacesKey = !!process.env.GOOGLE_PLACES_API_KEY;

  return <AdminDashboard stats={stats} hasGithubToken={hasGithubToken} hasPlacesKey={hasPlacesKey} />;
}
