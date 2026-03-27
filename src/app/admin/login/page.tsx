"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (res.ok) {
      router.push("/admin");
    } else {
      setError("Wrong password");
      setPassword("");
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F2EE] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-playfair text-4xl font-bold text-stone-900 mb-1">Admin</h1>
        <p className="text-sm text-stone-500 mb-10">Düssi Cafes</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="bg-white border border-[#E0DDD9] px-4 py-3 text-sm text-stone-800 outline-none focus:border-[#2D6A4F] transition-colors placeholder:text-stone-400"
          />

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading || !password}
            className="bg-[#2D6A4F] text-white text-xs uppercase tracking-widest py-3 hover:bg-[#245a42] transition-colors disabled:opacity-40"
          >
            {loading ? "Checking…" : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
