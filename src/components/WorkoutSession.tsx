import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import useWorkoutSession, {
  type CheckItem,
  type SessionSet,
  type SetChanges,
} from "../hooks/useWorkoutSession";

// "" z pola liczbowego zamieniamy na null, resztę na liczbę
function toNumber(value: string) {
  return value === "" ? null : Number(value);
}

// np. "Seria 2 · L" albo "Seria 1 · szczebel 3"
function setLabel(set: SessionSet) {
  const parts = [`Seria ${set.set_no}`];
  if (set.rung_no !== null) parts.push(`szczebel ${set.rung_no}`);
  if (set.side !== null) parts.push(set.side === "L" ? "L" : "P");
  return parts.join(" · ");
}

// serie są posortowane po position, więc wystarczy zbierać kolejne
// wiersze z tą samą pozycją w jedną grupę = jedno ćwiczenie
function groupByExercise(sets: SessionSet[]) {
  const groups: SessionSet[][] = [];
  for (const set of sets) {
    const last = groups.at(-1);
    if (last && last[0].position === set.position) last.push(set);
    else groups.push([set]);
  }
  return groups;
}

const inputClass =
  "w-16 rounded border px-2 py-1 bg-brand-surface border-brand-border text-zinc-100 text-right";

function NumberField({
  label,
  value,
  step,
  onChange,
  onBlur,
}: {
  label: string;
  value: number | null;
  step?: string;
  onChange: (value: number | null) => void;
  onBlur: () => void;
}) {
  return (
    <label className="flex items-center gap-1 text-xs text-zinc-500">
      <input
        type="number"
        min="0"
        step={step}
        inputMode="decimal"
        value={value ?? ""}
        onChange={(e) => onChange(toNumber(e.target.value))}
        onBlur={onBlur}
        className={inputClass}
      />
      {label}
    </label>
  );
}

function CheckList({ title, items }: { title: string; items: CheckItem[] }) {
  // odhaczenia żyją tylko na ekranie, nie zapisujemy ich w bazie
  const [checked, setChecked] = useState<string[]>([]);
  if (items.length === 0) return null;

  function toggle(id: string) {
    setChecked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div className="mb-6">
      <h3 className="mb-2 text-sm font-medium text-zinc-400">{title}</h3>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <label className="flex items-center gap-2 text-zinc-100">
              <input
                type="checkbox"
                checked={checked.includes(item.id)}
                onChange={() => toggle(item.id)}
                className="size-4 accent-brand-gold"
              />
              {item.exercise.name}
              {item.notes && (
                <span className="text-sm text-zinc-500">· {item.notes}</span>
              )}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function WorkoutSession() {
  const { id = "" } = useParams();
  const {
    session,
    sets,
    checkItems,
    boxPositions,
    editSet,
    saveSet,
    finishSession,
    isLoading,
    fetchError,
  } = useWorkoutSession(id);
  const [errorMessage, setErrorMessage] = useState<null | string>(null);

  async function handleSave(setId: string, changes?: SetChanges) {
    setErrorMessage(null);
    const error = await saveSet(setId, changes);
    if (error)
      setErrorMessage("Nie udało się zapisać serii. Spróbuj ponownie.");
  }

  async function handleFinish() {
    setErrorMessage(null);
    const error = await finishSession();
    if (error)
      setErrorMessage("Nie udało się zakończyć treningu. Spróbuj ponownie.");
  }

  if (isLoading) {
    return (
      <section className="mx-auto max-w-sm px-4 py-10" role="status">
        <p className="text-sm text-zinc-500">Ładowanie ...</p>
      </section>
    );
  }

  if (fetchError || !session) {
    return (
      <section className="mx-auto max-w-sm px-4 py-10">
        <p className="text-sm text-red-400" role="alert">
          Nie udało się pobrać treningu. Odśwież stronę.
        </p>
        <Link to="/plany" className="text-sm text-brand-gold underline">
          ← Wróć do planów
        </Link>
      </section>
    );
  }

  const doneCount = sets.filter((set) => set.done).length;

  return (
    <section className="mx-auto max-w-sm px-4 py-10">
      <Link to="/plany" className="text-sm text-zinc-400 hover:text-zinc-100">
        ← Plany
      </Link>
      <h2 className="mt-2 text-2xl font-semibold text-zinc-100">
        Trening {session.template?.name ?? ""}
      </h2>
      <p className="mb-6 text-sm text-zinc-500">
        {session.date} · zrobione serie: {doneCount}/{sets.length}
      </p>

      <CheckList
        title="Rozgrzewka"
        items={checkItems.filter((item) => item.block === "warmup")}
      />

      <h3 className="mb-2 text-sm font-medium text-zinc-400">Część główna</h3>
      {sets.length === 0 && (
        <p className="mb-6 text-sm text-zinc-500">
          Plan nie ma ćwiczeń w części głównej.
        </p>
      )}
      {groupByExercise(sets).map((group) => {
        const exercise = group[0].exercise;
        return (
          <div key={group[0].position} className="mb-6">
            <h4 className="mb-1 text-zinc-100">{exercise.name}</h4>
            <ol className="divide-y divide-brand-border">
              {group.map((set) => (
                <li
                  key={set.id}
                  className={`flex flex-wrap items-center gap-2 py-2 ${set.done ? "opacity-60" : ""}`}
                >
                  <label className="flex flex-1 items-center gap-2 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={set.done}
                      onChange={() => handleSave(set.id, { done: !set.done })}
                      className="size-5 accent-brand-gold"
                    />
                    {setLabel(set)}
                  </label>
                  {exercise.measure === "reps" && (
                    <NumberField
                      label="powt."
                      value={set.reps}
                      onChange={(reps) => editSet(set.id, { reps })}
                      onBlur={() => handleSave(set.id)}
                    />
                  )}
                  {exercise.measure === "time" && (
                    <NumberField
                      label="s"
                      value={set.seconds}
                      onChange={(seconds) => editSet(set.id, { seconds })}
                      onBlur={() => handleSave(set.id)}
                    />
                  )}
                  {exercise.uses_weight && (
                    <NumberField
                      label="kg"
                      step="0.5"
                      value={set.weight_kg}
                      onChange={(weight_kg) => editSet(set.id, { weight_kg })}
                      onBlur={() => handleSave(set.id)}
                    />
                  )}
                  {boxPositions.includes(set.position) && (
                    <NumberField
                      label="cm"
                      step="0.5"
                      value={set.box_cm}
                      onChange={(box_cm) => editSet(set.id, { box_cm })}
                      onBlur={() => handleSave(set.id)}
                    />
                  )}
                </li>
              ))}
            </ol>
          </div>
        );
      })}

      <CheckList
        title="Rozciąganie"
        items={checkItems.filter((item) => item.block === "cooldown")}
      />

      <div className="mb-4 text-sm text-red-400" role="alert">
        {errorMessage}
      </div>

      {session.finished_at ? (
        <p className="text-sm text-brand-gold" role="status">
          Trening zakończony 💪
        </p>
      ) : (
        <button
          type="button"
          onClick={handleFinish}
          className="w-full rounded bg-brand-gold text-brand-bg py-2 font-medium"
        >
          Zakończ trening
        </button>
      )}
    </section>
  );
}
