import { useState } from "react";
import { parseDiary, type ParsedDay } from "../lib/parseDiary";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export default function ImportScreen({ session }: { session: Session }) {
  const [raw, setRaw] = useState("");
  const [rows, setRows] = useState<ParsedDay[]>([]);

  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleImport() {
    if (!window.confirm(`Zapisać ${rows.length} dni do bazy?`)) return;
    setImporting(true);
    setResult(null);

    const payload = rows.map((r) => ({
      ...r,
      user_id: session.user.id,
    }));

    const { error } = await supabase
      .from("daily_logs")
      .upsert(payload, { onConflict: "user_id,date" });

    setResult(
      error
        ? `Błąd: ${error.message}`
        : `Zaimportowano ${payload.length} dni ✓`,
    );
    setImporting(false);
  }

  const count = (fn: (r: ParsedDay) => boolean) => rows.filter(fn).length;

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 space-y-4">
      <h2 className="text-xl font-semibold">Import historii (podgląd)</h2>
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder="Wklej tutaj całą treść dziennika…"
        className="h-48 w-full rounded border p-3 font-mono text-sm"
      />
      <button
        onClick={() => setRows(parseDiary(raw))}
        className="rounded bg-slate-900 px-4 py-2 text-white"
      >
        Parsuj
      </button>
      {rows.length > 0 && (
        <button
          onClick={handleImport}
          disabled={importing}
          className="rounded bg-emerald-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {importing ? "Importuję…" : `Importuj do bazy (${rows.length})`}
        </button>
      )}
      {result && <p className="text-sm">{result}</p>}
      {rows.length > 0 && (
        <>
          <p className="text-sm text-slate-500">
            Dni: <b>{rows.length}</b> · z wagą:{" "}
            {count((r) => r.weight_kg !== null)} · z pasem:{" "}
            {count((r) => r.waist_cm !== null)} · z krokami:{" "}
            {count((r) => r.steps !== null)} · posty: {count((r) => r.fasting)}
          </p>
          <div className="max-h-96 overflow-auto rounded border">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-100">
                <tr>
                  <th className="px-2 py-1">data</th>
                  <th className="px-2 py-1">waga</th>
                  <th className="px-2 py-1">pas</th>
                  <th className="px-2 py-1">kroki</th>
                  <th className="px-2 py-1">post</th>
                  <th className="px-2 py-1">notatka</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${r.date}-${i}`} className="border-t">
                    <td className="px-2 py-1">{r.date}</td>
                    <td className="px-2 py-1">{r.weight_kg ?? "—"}</td>
                    <td className="px-2 py-1">{r.waist_cm ?? "—"}</td>
                    <td className="px-2 py-1">{r.steps ?? "—"}</td>
                    <td className="px-2 py-1">{r.fasting ? "✓" : ""}</td>
                    <td className="px-2 py-1">{r.notes ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
