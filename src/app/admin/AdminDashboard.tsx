"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Stats {
  total: number;
  withPhoto: number;
  withRating: number;
  enriched: number;
  categories: [string, number][];
  lastSync: string | null;
}

interface WorkflowRun {
  id: number;
  status: string;
  conclusion: string | null;
  createdAt: string;
  url: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  "specialty-coffee": "Specialty Coffee",
  bakery: "Bakery",
  brunch: "Brunch",
  roastery: "Roastery",
  "work-friendly": "Work-friendly",
  "late-evening": "Late Evening",
};

function RunStatus({ run }: { run: WorkflowRun | null }) {
  if (!run) return null;
  const color =
    run.status === "completed"
      ? run.conclusion === "success"
        ? "text-[#2D6A4F]"
        : "text-red-500"
      : "text-amber-600";
  const label =
    run.status === "completed"
      ? run.conclusion === "success"
        ? "Completed"
        : `Failed (${run.conclusion})`
      : run.status === "in_progress"
      ? "Running…"
      : "Queued…";

  return (
    <div className="flex items-center gap-3 text-xs">
      <span className={`font-medium ${color}`}>{label}</span>
      <a
        href={run.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-stone-400 hover:text-stone-700 underline underline-offset-2 transition-colors"
      >
        View on GitHub
      </a>
      <span className="text-stone-400">{new Date(run.createdAt).toLocaleString()}</span>
    </div>
  );
}

export default function AdminDashboard({
  stats,
  hasGithubToken,
}: {
  stats: Stats;
  hasGithubToken: boolean;
}) {
  const router = useRouter();
  const [syncRun, setSyncRun] = useState<WorkflowRun | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);

  const pollRun = useCallback(async (workflow: string, setter: (r: WorkflowRun | null) => void) => {
    const res = await fetch(`/api/admin/trigger?workflow=${workflow}`);
    const { run } = await res.json();
    setter(run);
    if (run && run.status !== "completed") {
      setTimeout(() => pollRun(workflow, setter), 4000);
    }
  }, []);

  useEffect(() => {
    pollRun("sync.yml", setSyncRun);
  }, [pollRun]);

  async function triggerSync() {
    setSyncLoading(true);
    const res = await fetch("/api/admin/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflow: "sync.yml" }),
    });
    const data = await res.json();
    setSyncLoading(false);
    if (data.run) {
      setSyncRun(data.run);
      if (data.run.status !== "completed") {
        setTimeout(() => pollRun("sync.yml", setSyncRun), 4000);
      }
    }
  }

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[#F5F2EE]">
      {/* Header */}
      <header className="border-b border-[#E0DDD9]">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="font-playfair text-2xl font-bold text-stone-900">Admin</h1>
            <p className="text-xs text-stone-500 uppercase tracking-wider mt-0.5">Düssi Cafes</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="text-xs uppercase tracking-wider text-stone-500 hover:text-stone-800 transition-colors">
              View site
            </a>
            <button onClick={logout} className="text-xs uppercase tracking-wider text-stone-500 hover:text-stone-800 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-10">

        {/* Stats */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-stone-400 mb-5">Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total cafes", value: stats.total },
              { label: "With photos", value: `${stats.withPhoto}/${stats.total}` },
              { label: "With ratings", value: `${stats.withRating}/${stats.total}` },
              { label: "Edited", value: stats.enriched },
            ].map((s) => (
              <div key={s.label} className="bg-white p-5 border border-[#E0DDD9]">
                <p className="font-playfair text-3xl font-bold text-stone-900">{s.value}</p>
                <p className="text-xs text-stone-500 mt-1 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-white border border-[#E0DDD9] p-5">
            <p className="text-xs text-stone-400 uppercase tracking-wider mb-3">Categories</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {stats.categories.map(([cat, count]) => (
                <span key={cat} className="text-sm text-stone-700">
                  <span className="font-medium">{count}</span>
                  <span className="text-stone-400 ml-1">{CATEGORY_LABELS[cat] ?? cat}</span>
                </span>
              ))}
            </div>
            {stats.lastSync && (
              <p className="text-xs text-stone-400 mt-4">
                Last sync: {new Date(stats.lastSync).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
          </div>
        </section>

        {/* Quick links */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-stone-400 mb-5">Manage</h2>
          <div className="flex flex-col gap-3">
            <a
              href="/admin/cafes"
              className="flex items-center justify-between bg-white border border-[#E0DDD9] px-6 py-4 hover:border-stone-400 transition-colors group"
            >
              <div>
                <p className="text-sm font-medium text-stone-900">Edit cafes</p>
                <p className="text-xs text-stone-400 mt-0.5">Correct names, upload photos, add comments</p>
              </div>
              <span className="text-stone-300 group-hover:text-stone-600 transition-colors">&rarr;</span>
            </a>
            <a
              href="/admin/lifestyle"
              className="flex items-center justify-between bg-white border border-[#E0DDD9] px-6 py-4 hover:border-stone-400 transition-colors group"
            >
              <div>
                <p className="text-sm font-medium text-stone-900">Edit lifestyle sections</p>
                <p className="text-xs text-stone-400 mt-0.5">Manage beans, gear, kits, and apparel picks</p>
              </div>
              <span className="text-stone-300 group-hover:text-stone-600 transition-colors">&rarr;</span>
            </a>
            <a
              href="/admin/categories"
              className="flex items-center justify-between bg-white border border-[#E0DDD9] px-6 py-4 hover:border-stone-400 transition-colors group"
            >
              <div>
                <p className="text-sm font-medium text-stone-900">Edit categories</p>
                <p className="text-xs text-stone-400 mt-0.5">Rename filter tags and show or hide them</p>
              </div>
              <span className="text-stone-300 group-hover:text-stone-600 transition-colors">&rarr;</span>
            </a>
          </div>
        </section>

        {/* Sync */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-stone-400 mb-5">Sync from Google Maps</h2>
          <div className="bg-white border border-[#E0DDD9] p-6 flex flex-col gap-4">
            <p className="text-sm text-stone-600 leading-relaxed">
              Scrapes your Google Maps saved list, updates ratings, photos, and status for all cafes,
              then redeploys the site. Runs in GitHub Actions — takes ~3–4 minutes.
            </p>

            {!hasGithubToken && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2">
                GITHUB_TOKEN is not set in Vercel environment variables.
              </p>
            )}

            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={triggerSync}
                disabled={syncLoading || !hasGithubToken}
                className="bg-[#2D6A4F] text-white text-xs uppercase tracking-widest px-6 py-2.5 hover:bg-[#245a42] transition-colors disabled:opacity-40"
              >
                {syncLoading ? "Triggering…" : "Sync now"}
              </button>
              <RunStatus run={syncRun} />
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
