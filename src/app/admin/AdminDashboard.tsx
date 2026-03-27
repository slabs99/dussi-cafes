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
  hasPlacesKey,
}: {
  stats: Stats;
  hasGithubToken: boolean;
  hasPlacesKey: boolean;
}) {
  const router = useRouter();
  const [syncRun, setSyncRun] = useState<WorkflowRun | null>(null);
  const [enrichRun, setEnrichRun] = useState<WorkflowRun | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [enrichLoading, setEnrichLoading] = useState(false);

  // Poll run status while in progress
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
    pollRun("enrich.yml", setEnrichRun);
  }, [pollRun]);

  async function triggerWorkflow(
    workflow: string,
    setLoading: (v: boolean) => void,
    setRun: (r: WorkflowRun | null) => void
  ) {
    setLoading(true);
    const res = await fetch("/api/admin/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflow }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.run) {
      setRun(data.run);
      if (data.run.status !== "completed") {
        setTimeout(() => pollRun(workflow, setRun), 4000);
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
      <header className="border-b border-[#E0DDD9] bg-[#F5F2EE]">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="font-playfair text-2xl font-bold text-stone-900">Admin</h1>
            <p className="text-xs text-stone-500 uppercase tracking-wider mt-0.5">Düssi Cafes</p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="text-xs uppercase tracking-wider text-stone-500 hover:text-stone-800 transition-colors"
            >
              View site
            </a>
            <button
              onClick={logout}
              className="text-xs uppercase tracking-wider text-stone-500 hover:text-stone-800 transition-colors"
            >
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
              { label: "Enriched", value: `${stats.enriched}/${stats.total}` },
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

        {/* Sync */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-stone-400 mb-5">Sync from Google Maps</h2>
          <div className="bg-white border border-[#E0DDD9] p-6 flex flex-col gap-4">
            <p className="text-sm text-stone-600 leading-relaxed">
              Scrapes your Google Maps saved list via Playwright, updates cafe data (ratings, photos, status),
              and redeploys the site. Runs in GitHub Actions — takes ~3–4 minutes.
            </p>

            {!hasGithubToken && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2">
                GITHUB_TOKEN is not set. Add it to your Vercel environment variables to enable remote sync.
              </p>
            )}

            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={() => triggerWorkflow("sync.yml", setSyncLoading, setSyncRun)}
                disabled={syncLoading || !hasGithubToken}
                className="bg-[#2D6A4F] text-white text-xs uppercase tracking-widest px-6 py-2.5 hover:bg-[#245a42] transition-colors disabled:opacity-40"
              >
                {syncLoading ? "Triggering…" : "Sync now"}
              </button>

              <RunStatus run={syncRun} />
            </div>
          </div>
        </section>

        {/* Enrich */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-stone-400 mb-5">Enrich with Google Places</h2>
          <div className="bg-white border border-[#E0DDD9] p-6 flex flex-col gap-4">
            <p className="text-sm text-stone-600 leading-relaxed">
              Calls the Google Places API to add full opening hours, website, and phone number to each cafe.
              Incremental — only fetches cafes that are not yet enriched. Costs ~$2 for all 96 cafes.
            </p>

            {!hasPlacesKey && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2">
                GOOGLE_PLACES_API_KEY is not set as a GitHub Actions secret. Add it to enable enrichment.
              </p>
            )}

            {!hasGithubToken && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2">
                GITHUB_TOKEN is not set. Required to trigger the enrichment workflow.
              </p>
            )}

            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={() => triggerWorkflow("enrich.yml", setEnrichLoading, setEnrichRun)}
                disabled={enrichLoading || !hasGithubToken || !hasPlacesKey}
                className="bg-stone-800 text-white text-xs uppercase tracking-widest px-6 py-2.5 hover:bg-stone-900 transition-colors disabled:opacity-40"
              >
                {enrichLoading ? "Triggering…" : "Enrich now"}
              </button>

              <RunStatus run={enrichRun} />
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
