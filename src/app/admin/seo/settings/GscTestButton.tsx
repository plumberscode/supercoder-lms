"use client";

import { useState } from "react";
import { testGscConnection, type GscTestResult } from "../actions";

export default function GscTestButton() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<GscTestResult | null>(null);

  const run = async () => {
    setBusy(true);
    setResult(null);
    try {
      setResult(await testGscConnection());
    } catch (e) {
      setResult({ ok: false, property: "", sites: [], message: e instanceof Error ? e.message : "Tes gagal." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
      >
        {busy ? "Menguji koneksi…" : "Tes koneksi GSC"}
      </button>

      {result && (
        <div
          className={`mt-2 rounded-xl p-3 text-xs ${
            result.ok ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"
          }`}
        >
          <p className="font-semibold">
            {result.ok ? "✅" : "⚠️"} {result.message}
          </p>

          {result.sample && (
            <div className="mt-2">
              <p>
                {result.sample.range}: <b>{result.sample.clicks}</b> klik · <b>{result.sample.impressions}</b> impresi
              </p>
              {result.sample.topQueries.length > 0 ? (
                <ul className="mt-1 list-disc pl-5">
                  {result.sample.topQueries.map((q) => (
                    <li key={q.query}>
                      {q.query}: {q.clicks} klik, {q.impressions} impresi, posisi {q.position}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1">Belum ada data query di periode ini.</p>
              )}
            </div>
          )}

          {!result.ok && result.sites.length > 0 && (
            <div className="mt-2">
              <p>Properti yang bisa diakses service account:</p>
              <ul className="mt-1 list-disc pl-5 font-mono">
                {result.sites.map((s) => (
                  <li key={s.siteUrl}>
                    {s.siteUrl} <span className="text-slate-500">({s.permissionLevel})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
