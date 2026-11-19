import { useState, type SyntheticEvent } from "react";
import { Link, useParams } from "react-router-dom";
import useExercises from "../hooks/useExercises";
import { ladderRungs } from "../lib/ladder";
import useTemplateExercises, {
  type Block,
  type Scheme,
  type TemplateExercise,
} from "../hooks/useTemplateExercises";

const BLOCKS: { value: Block; label: string }[] = [
  { value: "warmup", label: "Rozgrzewka" },
  { value: "main", label: "Część główna" },
  { value: "cooldown", label: "Rozciąganie" },
];

// "" z pola liczbowego zamieniamy na null, resztę na liczbę
function toNumber(value: string) {
  return value === "" ? null : Number(value);
}

// np. "3 × 8–10 · 20 kg", "2 × 60 s" albo "3 × drabina 1-2-3 · 20 kg"
function describe(item: TemplateExercise) {
  const parts: string[] = [];
  if (
    item.scheme === "ladder" &&
    item.ladder_step !== null &&
    item.ladder_top !== null
  ) {
    const rungs = ladderRungs(item.ladder_step, item.ladder_top);
    parts.push(`${item.sets} × drabina ${rungs.join("-")}`);
  } else if (item.target_seconds !== null) {
    parts.push(`${item.sets} × ${item.target_seconds} s`);
  } else if (item.target_min !== null) {
    const reps =
      item.target_max !== null && item.target_max !== item.target_min
        ? `${item.target_min}–${item.target_max}`
        : `${item.target_min}`;
    parts.push(`${item.sets} × ${reps}`);
  } else {
    parts.push(`${item.sets} ${item.sets === 1 ? "seria" : "serie"}`);
  }
  if (item.exercise.unilateral) parts.push("na stronę");
  if (item.weight_kg !== null) parts.push(`${item.weight_kg} kg`);
  if (item.box_cm !== null) parts.push(`box ${item.box_cm} cm`);
  return parts.join(" · ");
}

const inputClass =
  "w-full rounded border px-3 py-2 bg-brand-surface border-brand-border text-zinc-100 placeholder:text-zinc-500";
const labelClass = "block text-sm text-zinc-400";

export default function WorkoutTemplateDetails() {
  const { id = "" } = useParams();
  const { templateName, items, addItem, isLoading, fetchError } =
    useTemplateExercises(id);
  const { exercises } = useExercises();

  const [exerciseId, setExerciseId] = useState("");
  const [block, setBlock] = useState<Block>("main");
  const [sets, setSets] = useState("3");
  const [scheme, setScheme] = useState<Scheme>("straight");
  const [ladderStep, setLadderStep] = useState("1");
  const [ladderTop, setLadderTop] = useState("");
  const [targetMin, setTargetMin] = useState("");
  const [targetMax, setTargetMax] = useState("");
  const [targetSeconds, setTargetSeconds] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [boxCm, setBoxCm] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<null | string>(null);

  const selected = exercises.find((ex) => ex.id === exerciseId);

  async function handleAdd(e: SyntheticEvent) {
    e.preventDefault();
    setErrorMessage(null);
    if (!selected) return;

    const isTime = selected.measure === "time";
    // drabina ma sens tylko przy ćwiczeniach na powtórzenia
    const isLadder = !isTime && scheme === "ladder";
    const step = Number(ladderStep);
    const top = Number(ladderTop);

    if (isLadder && top % step !== 0) {
      setErrorMessage(
        "Szczyt drabiny musi być wielokrotnością kroku (np. 2-4-6)",
      );
      return;
    }

    const min = toNumber(targetMin);
    const error = await addItem({
      exercise_id: selected.id,
      block,
      sets: Number(sets),
      scheme: isLadder ? "ladder" : "straight",
      target_min: isTime || isLadder ? null : min,
      // puste "max" = stała liczba powtórzeń, czyli max = min
      target_max: isTime || isLadder ? null : (toNumber(targetMax) ?? min),
      target_seconds: isTime ? toNumber(targetSeconds) : null,
      ladder_step: isLadder ? step : null,
      ladder_top: isLadder ? top : null,
      weight_kg: selected.uses_weight ? toNumber(weightKg) : null,
      box_cm: toNumber(boxCm),
      notes: notes.trim() || null,
    });

    if (error?.code === "23514") {
      setErrorMessage(
        "Sprawdź wartości: „od” nie może być większe niż „do”, a krok drabiny większy niż szczyt",
      );
      return;
    } else if (error) {
      setErrorMessage("Wystąpił błąd, spróbuj ponownie");
      return;
    }

    setExerciseId("");
    setScheme("straight");
    setLadderStep("1");
    setLadderTop("");
    setTargetMin("");
    setTargetMax("");
    setTargetSeconds("");
    setWeightKg("");
    setBoxCm("");
    setNotes("");
  }

  if (isLoading) {
    return (
      <section className="mx-auto max-w-sm px-4 py-10" role="status">
        <p className="text-sm text-zinc-500">Ładowanie ...</p>
      </section>
    );
  }

  if (fetchError) {
    return (
      <section className="mx-auto max-w-sm px-4 py-10">
        <p className="text-sm text-red-400" role="alert">
          Nie udało się pobrać planu. Odśwież stronę.
        </p>
        <Link to="/plany" className="text-sm text-brand-gold underline">
          ← Wróć do planów
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-sm px-4 py-10">
      <Link to="/plany" className="text-sm text-zinc-400 hover:text-zinc-100">
        ← Wszystkie plany
      </Link>
      <h2 className="mt-2 mb-6 text-2xl font-semibold text-zinc-100">
        Plan {templateName}
      </h2>

      {BLOCKS.map(({ value, label }) => {
        const blockItems = items.filter((item) => item.block === value);
        if (blockItems.length === 0) return null;
        return (
          <div key={value} className="mb-6">
            <h3 className="mb-2 text-sm font-medium text-zinc-400">{label}</h3>
            <ol className="divide-y divide-brand-border">
              {blockItems.map((item) => (
                <li key={item.id} className="py-2">
                  <div className="flex justify-between gap-2 text-zinc-100">
                    {item.exercise.name}
                    <span className="text-sm text-zinc-500">
                      {describe(item)}
                    </span>
                  </div>
                  {item.notes && (
                    <p className="text-sm text-zinc-500">{item.notes}</p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        );
      })}
      {items.length === 0 && (
        <p className="mb-6 text-sm text-zinc-500">
          Plan jest pusty — dodaj pierwsze ćwiczenie poniżej.
        </p>
      )}

      <h2 className="mb-4 text-xl font-semibold text-zinc-100">
        Dodaj ćwiczenie do planu
      </h2>
      <form onSubmit={handleAdd} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="te-exercise" className={labelClass}>
            Ćwiczenie
          </label>
          <select
            id="te-exercise"
            value={exerciseId}
            onChange={(e) => setExerciseId(e.target.value)}
            required
            className={inputClass}
          >
            <option value="">— wybierz —</option>
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="te-block" className={labelClass}>
            Część treningu
          </label>
          <select
            id="te-block"
            value={block}
            onChange={(e) => setBlock(e.target.value as Block)}
            className={inputClass}
          >
            {BLOCKS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="te-sets" className={labelClass}>
            Liczba serii
          </label>
          <input
            id="te-sets"
            type="number"
            min="1"
            value={sets}
            onChange={(e) => setSets(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        {selected?.measure === "reps" && (
          <div className="space-y-1">
            <label htmlFor="te-scheme" className={labelClass}>
              Schemat
            </label>
            <select
              id="te-scheme"
              value={scheme}
              onChange={(e) => setScheme(e.target.value as Scheme)}
              className={inputClass}
            >
              <option value="straight">zwykłe serie</option>
              <option value="ladder">drabina</option>
            </select>
          </div>
        )}

        {selected?.measure === "reps" && scheme === "ladder" && (
          <fieldset className="space-y-1">
            <legend className={labelClass}>
              Drabina: krok i szczyt (np. 1 i 3 → 1-2-3, 2 i 6 → 2-4-6)
            </legend>
            <div className="flex gap-2">
              <label className="sr-only" htmlFor="te-ladder-step">
                Krok
              </label>
              <input
                id="te-ladder-step"
                type="number"
                min="1"
                placeholder="krok"
                value={ladderStep}
                onChange={(e) => setLadderStep(e.target.value)}
                required
                className={inputClass}
              />
              <label className="sr-only" htmlFor="te-ladder-top">
                Szczyt
              </label>
              <input
                id="te-ladder-top"
                type="number"
                min="1"
                placeholder="szczyt"
                value={ladderTop}
                onChange={(e) => setLadderTop(e.target.value)}
                required
                className={inputClass}
              />
            </div>
          </fieldset>
        )}

        {selected?.measure === "reps" && scheme === "straight" && (
          <fieldset className="space-y-1">
            <legend className={labelClass}>
              Powtórzenia w serii (np. 8–10, przy stałej liczbie tylko „od”)
            </legend>
            <div className="flex gap-2">
              <label className="sr-only" htmlFor="te-min">
                Od
              </label>
              <input
                id="te-min"
                type="number"
                min="1"
                placeholder="od"
                value={targetMin}
                onChange={(e) => setTargetMin(e.target.value)}
                className={inputClass}
              />
              <label className="sr-only" htmlFor="te-max">
                Do
              </label>
              <input
                id="te-max"
                type="number"
                min="1"
                placeholder="do"
                value={targetMax}
                onChange={(e) => setTargetMax(e.target.value)}
                className={inputClass}
              />
            </div>
          </fieldset>
        )}

        {selected?.measure === "time" && (
          <div className="space-y-1">
            <label htmlFor="te-seconds" className={labelClass}>
              Czas serii (sekundy)
            </label>
            <input
              id="te-seconds"
              type="number"
              min="1"
              value={targetSeconds}
              onChange={(e) => setTargetSeconds(e.target.value)}
              className={inputClass}
            />
          </div>
        )}

        {selected?.uses_weight && (
          <div className="space-y-1">
            <label htmlFor="te-weight" className={labelClass}>
              Ciężar (kg)
            </label>
            <input
              id="te-weight"
              type="number"
              min="0"
              step="0.5"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className={inputClass}
            />
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="te-box" className={labelClass}>
            Wysokość boxa w cm (opcjonalnie)
          </label>
          <input
            id="te-box"
            type="number"
            min="1"
            step="0.5"
            value={boxCm}
            onChange={(e) => setBoxCm(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="te-notes" className={labelClass}>
            Notatki (opcjonalnie)
          </label>
          <input
            id="te-notes"
            type="text"
            placeholder="tempo 3-1-1, RIR 1–2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputClass}
          />
        </div>

        <button
          className="w-full rounded bg-brand-gold text-brand-bg py-2 font-medium"
          type="submit"
        >
          Dodaj do planu
        </button>
        <div className="text-sm text-red-400" role="alert">
          {errorMessage}
        </div>
      </form>
    </section>
  );
}
