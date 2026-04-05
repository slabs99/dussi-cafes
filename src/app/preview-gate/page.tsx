"use client";

import { useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function GateForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(false);
    setLoading(true);

    const res = await fetch("/api/preview-gate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin, next }),
    });

    setLoading(false);

    if (res.ok) {
      const { redirect } = await res.json();
      window.location.href = redirect;
    } else {
      setError(true);
      setPin("");
      inputRef.current?.focus();
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F2EE] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-playfair font-bold text-5xl text-stone-900 leading-none">
            Düssi
            <br />
            Cafes.
          </h1>
          <p className="mt-3 text-xs uppercase tracking-widest text-stone-400">
            Preview access
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="pin"
              className="text-xs uppercase tracking-widest text-stone-500"
            >
              Access code
            </label>
            <input
              ref={inputRef}
              id="pin"
              type="password"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(false); }}
              placeholder="Enter code"
              autoFocus
              autoComplete="off"
              className={`w-full border px-4 py-3 text-sm text-stone-900 bg-white outline-none focus:border-[#2D6A4F] transition-colors placeholder:text-stone-300 ${
                error ? "border-red-400" : "border-[#E0DDD9]"
              }`}
            />
            {error && (
              <p className="text-xs text-red-500 mt-0.5">Incorrect code — try again.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !pin}
            className="w-full bg-[#2D6A4F] text-white text-xs uppercase tracking-widest py-3 hover:bg-[#245a42] transition-colors disabled:opacity-40"
          >
            {loading ? "Checking…" : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function PreviewGatePage() {
  return (
    <Suspense>
      <GateForm />
    </Suspense>
  );
}
