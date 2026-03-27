import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminDashboard from "./AdminDashboard";
import cafesData from "../../../public/data/cafes.json";
import overridesData from "../../../public/data/overrides.json";
import type { Cafe } from "@/types/cafe";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;
  if (!token || token !== process.env.ADMIN_SECRET) redirect("/admin/login");

  const cafes = cafesData as Cafe[];
  const overrides = overridesData as Record<string, unknown>;

  const stats = {
    total: cafes.length,
    withPhoto: cafes.filter((c) => c.photoUrl).length,
    withRating: cafes.filter((c) => c.rating !== null).length,
    enriched: Object.keys(overrides).length,
    categories: Object.entries(
      cafes.reduce<Record<string, number>>((acc, c) => {
        c.categories.forEach((cat) => { acc[cat] = (acc[cat] ?? 0) + 1; });
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1]),
    lastSync: cafes[0]?.addedAt ?? null,
  };

  return <AdminDashboard stats={stats} hasGithubToken={!!process.env.GITHUB_TOKEN} />;
}
