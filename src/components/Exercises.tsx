import { useEffect, useState, type SyntheticEvent } from "react";
import { supabase } from "../lib/supabase";

type Exercise = {
  id: string;
  name: string;
  measure: "reps" | "time";
  uses_weight: boolean;
  unilateral: boolean;
};

export default function Exercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [name, setName] = useState("");
  const [measure, setMeasure] = useState<Exercise["measure"]>("reps");
  const [usesWeight, setUsesWeight] = useState(false);
  const [unilateral, setUnilateral] = useState(false);

  useEffect(() => {
    supabase
      .from("exercises")
      .select("id, name, measure, uses_weight, unilateral")
      .order("name")
      .then(({ data }) => {
        if (!data) return;
        setExercises(data);
      });
  }, []);

  async function handleAdd(e: SyntheticEvent) {
    e.preventDefault();

    const { data, error } = await supabase
      .from("exercises")
      .insert({ name, measure, uses_weight: usesWeight, unilateral })
      .select("id, name, measure, uses_weight, unilateral")
      .single();

    if (error) {
      console.error(error);
      return;
    }
    setExercises(
      [...exercises, data].sort((a, b) => a.name.localeCompare(b.name, "pl")),
    );
    setName("");
    setMeasure("reps");
    setUsesWeight(false);
    setUnilateral(false);
  }

  return (
    <section className="mx-auto max-w-sm px-4 py-10">
      <h2 className="text-xl font-semibold text-zinc-100 mb-4">
        Dodaj ćwiczenie
      </h2>
      <form onSubmit={handleAdd} className="mb-10 space-y-4">
        <div className="space-y-1">
          <label htmlFor="name" className="block text-sm text-zinc-400">
            Nazwa ćwiczenia
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="pompki"
            className="w-full rounded border px-3 py-2 bg-brand-surface border-brand-border text-zinc-100 placeholder:text-zinc-500"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="measure" className="block text-sm text-zinc-400">
            Sposób pomiaru
          </label>
          <div className="relative">
            <select
              onChange={(e) =>
                setMeasure(e.target.value as Exercise["measure"])
              }
              value={measure}
              className="w-full appearance-none rounded border px-3 py-2 pr-10 bg-brand-surface border-brand-border text-zinc-100"
              id="measure"
            >
              <option value="reps">powtórzenia</option>
              <option value="time">czas</option>
            </select>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
            >
              ▾
            </span>
          </div>
        </div>
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm text-zinc-400">Właściwości</legend>
          <label className="flex items-center gap-2 text-zinc-100">
            <input
              onChange={(e) => setUsesWeight(e.target.checked)}
              checked={usesWeight}
              type="checkbox"
              name="usesWeight"
              className="size-4 accent-brand-gold"
            />
            Z obciążeniem
          </label>

          <label className="flex items-center gap-2 text-zinc-100">
            <input
              onChange={(e) => setUnilateral(e.target.checked)}
              checked={unilateral}
              type="checkbox"
              name="unilateral"
              className="size-4 accent-brand-gold"
            />
            Ćwiczenie jednostronne
          </label>
        </fieldset>
        <button
          className="w-full rounded bg-brand-gold text-brand-bg py-2 font-medium"
          type="submit"
        >
          Dodaj
        </button>
      </form>
      <h2 className="mb-3 text-xl font-semibold text-zinc-100 ">
        Baza ćwiczeń
      </h2>
      {exercises.length === 0 && (
        <p className="text-sm text-zinc-500">
          Brak ćwiczeń — dodaj pierwsze powyżej.
        </p>
      )}
      <ul className="divide-y divide-brand-border">
        {exercises.map((exercise) => (
          <li
            key={exercise.id}
            className="flex justify-between py-2 text-zinc-100"
          >
            {exercise.name}
            <span className="text-sm text-zinc-500">
              {exercise.measure === "reps" ? "powtórzenia" : "czas"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
