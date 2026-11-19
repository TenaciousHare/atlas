import { useState, type SyntheticEvent } from "react";
import { type PostgrestError } from "@supabase/supabase-js";
import { type Exercise } from "../hooks/useExercises";

type Props = {
  exercise: Exercise;
  onSave: (changes: Omit<Exercise, "id">) => Promise<PostgrestError | null>;
  onCancel: () => void;
};

const inputClass =
  "w-full rounded border px-3 py-2 bg-brand-surface border-brand-border text-zinc-100";

export default function ExerciseEditForm({
  exercise,
  onSave,
  onCancel,
}: Props) {
  // formularz startuje z aktualnymi danymi ćwiczenia
  const [name, setName] = useState(exercise.name);
  const [measure, setMeasure] = useState(exercise.measure);
  const [usesWeight, setUsesWeight] = useState(exercise.uses_weight);
  const [unilateral, setUnilateral] = useState(exercise.unilateral);
  const [errorMessage, setErrorMessage] = useState<null | string>(null);

  // unikalne id dla każdego formularza edycji
  const prefix = `edit-${exercise.id}`;

  async function handleSave(e: SyntheticEvent) {
    e.preventDefault();
    setErrorMessage(null);
    const error = await onSave({
      name: name.trim(),
      measure,
      uses_weight: usesWeight,
      unilateral,
    });

    if (error?.code === "23505") {
      setErrorMessage("Ćwiczenie o tej nazwie już istnieje");
    } else if (error) {
      setErrorMessage("Wystąpił błąd, spróbuj ponownie");
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-3 py-3">
      <div className="space-y-1">
        <label
          htmlFor={`${prefix}-name`}
          className="block text-sm text-zinc-400"
        >
          Nazwa ćwiczenia
        </label>
        <input
          id={`${prefix}-name`}
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setErrorMessage(null);
          }}
          aria-invalid={errorMessage !== null}
          aria-describedby={`${prefix}-error`}
          required
          autoFocus
          className={`${inputClass} aria-invalid:border-red-400`}
        />
      </div>
      <div className="space-y-1">
        <label
          htmlFor={`${prefix}-measure`}
          className="block text-sm text-zinc-400"
        >
          Sposób pomiaru
        </label>
        <select
          id={`${prefix}-measure`}
          value={measure}
          onChange={(e) => setMeasure(e.target.value as Exercise["measure"])}
          className={inputClass}
        >
          <option value="reps">powtórzenia</option>
          <option value="time">czas</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-zinc-100">
        <input
          type="checkbox"
          checked={usesWeight}
          onChange={(e) => setUsesWeight(e.target.checked)}
          className="size-4 accent-brand-gold"
        />
        Z obciążeniem
      </label>
      <label className="flex items-center gap-2 text-zinc-100">
        <input
          type="checkbox"
          checked={unilateral}
          onChange={(e) => setUnilateral(e.target.checked)}
          className="size-4 accent-brand-gold"
        />
        Ćwiczenie jednostronne
      </label>
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded bg-brand-gold py-2 font-medium text-brand-bg"
        >
          Zapisz
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded border border-brand-border py-2 text-zinc-300 hover:bg-brand-surface"
        >
          Anuluj
        </button>
      </div>
      <div id={`${prefix}-error`} className="text-sm text-red-400" role="alert">
        {errorMessage}
      </div>
    </form>
  );
}
