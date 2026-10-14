import { useEffect, useState, type SyntheticEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

// data "dziś" w czasie LOKALNYM jako "RRRR-MM-DD"
const today = new Date().toLocaleDateString("sv-SE");

export default function DailyForm({ session }: { session: Session }) {
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [steps, setSteps] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  const toNum = (v: string) => (v === "" ? null : Number(v.replace(",", ".")));

  // wczytaj dzisiejszy wiersz przy wejściu (strategia b)
  useEffect(() => {
    supabase
      .from("daily_logs")
      .select("weight_kg, waist_cm, steps, notes")
      .eq("date", today)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setWeight(data.weight_kg?.toString() ?? "");
        setWaist(data.waist_cm?.toString() ?? "");
        setSteps(data.steps?.toString() ?? "");
        setNotes(data.notes ?? "");
      });
  }, []);

  async function handleSave(e: SyntheticEvent) {
    e.preventDefault();
    setStatus("saving");
    const { error } = await supabase.from("daily_logs").upsert(
      {
        user_id: session.user.id,
        date: today,
        weight_kg: toNum(weight),
        waist_cm: toNum(waist),
        steps: toNum(steps),
        notes: notes === "" ? null : notes,
      },
      { onConflict: "user_id,date" },
    );
    setStatus(error ? "error" : "saved");
  }

  return (
    <section className=" flex items-center justify-center px-4 py-10">
      <form onSubmit={handleSave} className="w-full max-w-sm space-y-4">
        <h2 className="text-xl font-semibold text-center text-zinc-100">
          Dziś · {today}
        </h2>

        <input
          type="text"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="waga"
          className="w-full rounded border px-3 py-2 bg-brand-surface border-brand-border text-zinc-100 placeholder:text-zinc-500"
        />
        <input
          type="text"
          value={waist}
          onChange={(e) => setWaist(e.target.value)}
          placeholder="pas"
          className="w-full rounded border px-3 py-2 bg-brand-surface border-brand-border text-zinc-100 placeholder:text-zinc-500"
        />
        <input
          type="text"
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          placeholder="kroki"
          className="w-full rounded border px-3 py-2 bg-brand-surface border-brand-border text-zinc-100 placeholder:text-zinc-500"
        />
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="uwagi"
          className="w-full rounded border px-3 py-2 bg-brand-surface border-brand-border text-zinc-100 placeholder:text-zinc-500"
        />

        <button
          type="submit"
          disabled={status === "saving"}
          className="w-full rounded bg-brand-gold text-brand-bg py-2 font-medium disabled:opacity-50"
        >
          {status === "saving" ? "Zapisywanie…" : "Zapisz"}
        </button>
        {status === "saved" && (
          <p className="text-sm text-green-400 text-center">Zapisano ✓</p>
        )}
        {status === "error" && (
          <p className="text-sm text-red-400 text-center">
            Nie udało się zapisać
          </p>
        )}
      </form>
    </section>
  );
}
